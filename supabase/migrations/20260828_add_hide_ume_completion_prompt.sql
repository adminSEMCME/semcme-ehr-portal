alter table public.profiles
add column if not exists hide_ume_completion_prompt boolean not null default false;

comment on column public.profiles.hide_ume_completion_prompt is
'When true, suppresses the UME series certificate reminder shown to medical students after completing a UME module.';
