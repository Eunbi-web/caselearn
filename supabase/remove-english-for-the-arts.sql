-- One-off cleanup for databases seeded before the "English for the Arts"
-- course was retired from src/data/cases.ts. The main seed is idempotent
-- ("on conflict do nothing"), so it cannot remove rows — run this once.
-- Entry codes (002-xx … 005-xx) are kept as-is on purpose: they are the
-- photo slot names (public/photos/entry-<code>.jpg).

delete from public.entries
where subject_id = (select id from public.subjects where slug = 'english-for-the-arts');

delete from public.subjects where slug = 'english-for-the-arts';

-- renumber the remaining four so the corner stickers read 01-04
update public.subjects set case_number = '001' where slug = 'creative-design-thinking';
update public.subjects set case_number = '002' where slug = 'drawing-techniques';
update public.subjects set case_number = '003' where slug = 'computer-graphics';
update public.subjects set case_number = '004' where slug = 'visual-communication';
