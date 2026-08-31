update public.modules
set ce_activity_code = case id
  when 'CME1' then '41134'
  when 'CME2' then '41143'
end
where id in ('CME1', 'CME2');
