-- Extra companion shape fields: pronouns, age, dynamic, heat, freeform extra.

alter table companion_profiles add column if not exists pronouns text not null default '';
alter table companion_profiles add column if not exists age integer not null default 28;
alter table companion_profiles add column if not exists dynamic text not null default '';
alter table companion_profiles add column if not exists heat integer not null default 4;
alter table companion_profiles add column if not exists extra text not null default '';
