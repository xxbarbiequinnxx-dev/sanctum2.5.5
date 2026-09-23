-- Photos and clips on the private companion thread.
alter table companion_messages add column if not exists photo_data text;
