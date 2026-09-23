-- Profile kink inventory (JSON array of slugs / custom labels).

alter table profiles
  add column if not exists kinks text not null default '[]';
