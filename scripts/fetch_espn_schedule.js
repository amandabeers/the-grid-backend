const fs = require('fs');
const path = require('path');

const outPath = path.resolve(__dirname, '../database/seeds/schedule_2026.json');
const year = 2026;
const seasontype = 2; // regular season

async function fetchWeek(week) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=${seasontype}&week=${week}&dates=${year}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch week ${week}: ${res.status}`);
  const data = await res.json();
  const events = data.events || [];

  const toETDateTime = (iso) => {
    if (!iso) return { dateET: '', timeET: '', etDateTime: '' };
    const dt = new Date(iso);
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    const parts = fmt.formatToParts(dt).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
    const dateET = `${parts.year}-${parts.month}-${parts.day}`;
    const timeET = `${parts.hour}:${parts.minute}:${parts.second}`;
    const etDateTime = `${dateET}T${timeET}`;
    return { dateET, timeET, etDateTime };
  };

  return events.map((ev) => {
    const comp = ev.competitions && ev.competitions[0];
    if (!comp) return null;
    const competitors = comp.competitors || [];
    const homeObj = competitors.find((c) => c.homeAway === 'home');
    const awayObj = competitors.find((c) => c.homeAway === 'away');
    const home = homeObj && homeObj.team && homeObj.team.abbreviation;
    const away = awayObj && awayObj.team && awayObj.team.abbreviation;

    const dateTimeUTC = ev.date || comp.date || null; // ISO UTC
    const { dateET, timeET, etDateTime } = toETDateTime(dateTimeUTC);

    // Extract venue from multiple potential locations in the payload
    const venue = (comp.venue && comp.venue) || (ev.venues && ev.venues[0]) || {};
    const venueName = venue.fullName || venue.name || '';
    const city = venue.address && (venue.address.city || venue.address.city) ? venue.address.city : '';
    const state = venue.address && venue.address.state ? venue.address.state : '';
    const country = venue.address && venue.address.country ? venue.address.country : '';
    const locationParts = [venueName, city, state, country].filter(Boolean);
    const location = locationParts.join(', ');

    return {
      week,
      date: dateET,
      time: timeET,
      home,
      away,
      location,
      startTimeUTC: dateTimeUTC || null,
      startTimeET: etDateTime || null
    };
  }).filter(Boolean);
}

(async () => {
  try {
    const all = [];
    for (let week = 1; week <= 18; week++) {
      console.log(`Fetching week ${week}...`);
      const games = await fetchWeek(week);
      all.push(...games);
      // be polite
      await new Promise((r) => setTimeout(r, 250));
    }
    fs.writeFileSync(outPath, JSON.stringify(all, null, 2));
    console.log(`Wrote ${all.length} games to ${outPath}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
