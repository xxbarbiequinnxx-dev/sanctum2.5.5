-- Multiple human partners. One is live; the rest wait on their own bonds.

create table if not exists partnerships (
  bond_id text primary key,
  user_a text not null,
  user_b text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists partnerships_pair_idx on partnerships (user_a, user_b);
create index if not exists partnerships_user_a_idx on partnerships (user_a);
create index if not exists partnerships_user_b_idx on partnerships (user_b);

insert into partnerships (bond_id, user_a, user_b)
select p.bond_id,
  case when p.user_id < p.partner_user_id then p.user_id else p.partner_user_id end,
  case when p.user_id < p.partner_user_id then p.partner_user_id else p.user_id end
from profiles p
where p.partner_user_id is not null
  and p.bond_id is not null
  and p.bond_id <> ''
on conflict (user_a, user_b) do nothing;

insert into partnerships (bond_id, user_a, user_b)
select p.last_bond_id,
  case when p.user_id < p.last_partner_user_id then p.user_id else p.last_partner_user_id end,
  case when p.user_id < p.last_partner_user_id then p.last_partner_user_id else p.user_id end
from profiles p
where p.last_partner_user_id is not null
  and p.last_bond_id is not null
  and p.last_bond_id <> ''
on conflict (user_a, user_b) do nothing;
