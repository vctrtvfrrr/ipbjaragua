import { date, integer, pgEnum, pgTable, text } from 'drizzle-orm/pg-core'
import { deletedAt, id, timestamps } from './common-fields'

export const memberStatus = pgEnum('member_status', ['active', 'transferred', 'deceased', 'removed', 'pending'])

export const members = pgTable('members', {
  id: id(),
  full_name: text('full_name').notNull(),
  sex: text('sex'),
  mother: text('mother'),
  father: text('father'),
  birth_date: date('birth_date', { mode: 'date' }),
  birth_place: text('birth_place'),
  marital_status: text('marital_status'),
  wedding_date: date('wedding_date', { mode: 'date' }),
  spouse: text('spouse'),
  phone: text('phone'),
  email: text('email'),
  address_street: text('address_street'),
  address_number: text('address_number'),
  address_complement: text('address_complement'),
  nationality: text('nationality'),
  education: text('education'),
  profession: text('profession'),
  home_church: text('home_church'),
  baptism_year: integer('baptism_year'),
  baptism_place: text('baptism_place'),
  prof_faith_year: integer('prof_faith_year'),
  prof_faith_place: text('prof_faith_place'),
  member_since: date('member_since', { mode: 'date' }),
  member_until: date('member_until', { mode: 'date' }),
  status: memberStatus('status').notNull(),
  ...timestamps(),
  ...deletedAt(),
})
