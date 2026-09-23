-- Remember the last human pair so solo/partner can switch without losing the bond.

alter table profiles
  add column if not exists last_partner_user_id text;

alter table profiles
  add column if not exists last_bond_id text;

update profiles
  set last_partner_user_id = partner_user_id,
      last_bond_id = bond_id
  where partner_user_id is not null
    and (last_partner_user_id is null or last_bond_id is null);
