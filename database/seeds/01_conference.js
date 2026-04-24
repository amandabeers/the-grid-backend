/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('conference').del()
  await knex('conference').insert([
    {
      name: 'American Football Conference',
      abbrv: 'AFC'
    },
    {
      name: 'National Football Conference',
      abbrv: 'NFC'
    },
  ]);
};
