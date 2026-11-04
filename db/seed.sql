-- Sample catalogue: the 12 placeholder products the store launched with.
-- Safe to run twice: products whose code already exists are skipped.

with p as (
  insert into products (slug, code, name, category, occasions, price_pence, fibre, summary, details, is_new, status, palette)
  values ('kandy-wrap-midi', 'D2601', 'Kandy wrap midi dress', 'dresses', array['avurudu','summer']::text[], 4900, '100% cotton', 'A tie-waist wrap dress in hand-waxed cotton, with a hand-drawn leaf vine that wraps the hem.', array['Hand-drawn wax resist','Tie waist, flutter sleeve','Midi length, 112 cm from shoulder (size 12)']::text[], true, 'active', array['#0F1F44','#FBF3E0','#3B4C8A']::text[])
  on conflict (code) do nothing
  returning id
)
insert into product_sizes (product_id, label, stock, position)
select p.id, s.label, 5, s.ord - 1 from p, unnest(array['8','10','12','14','16','18','20']::text[]) with ordinality as s(label, ord);

with p as (
  insert into products (slug, code, name, category, occasions, price_pence, fibre, summary, details, is_new, status, palette)
  values ('galle-shirt-dress', 'D2602', 'Galle shirt dress', 'dresses', array['summer']::text[], 4500, '100% cotton', 'Relaxed button-through shirt dress in deep indigo batik with a soft crackle finish.', array['Button front with pockets','Relaxed fit — size down for a closer fit','Knee length']::text[], false, 'active', array['#3B4C8A','#F7D287','#C48732']::text[])
  on conflict (code) do nothing
  returning id
)
insert into product_sizes (product_id, label, stock, position)
select p.id, s.label, 5, s.ord - 1 from p, unnest(array['8','10','12','14','16','18','20']::text[]) with ordinality as s(label, ord);

with p as (
  insert into products (slug, code, name, category, occasions, price_pence, fibre, summary, details, is_new, status, palette)
  values ('avurudu-tiered-frock', 'D2603', 'Avurudu tiered frock', 'dresses', array['avurudu','temple']::text[], 5900, '100% cotton', 'A three-tier frock in warm gold and deep navy, made for New Year mornings and family visits.', array['Three gathered tiers','Elbow sleeves, modest neckline','Fully lined bodice']::text[], true, 'active', array['#E4AC56','#0F1F44','#FBF3E0']::text[])
  on conflict (code) do nothing
  returning id
)
insert into product_sizes (product_id, label, stock, position)
select p.id, s.label, 5, s.ord - 1 from p, unnest(array['8','10','12','14','16','18','20']::text[]) with ordinality as s(label, ord);

with p as (
  insert into products (slug, code, name, category, occasions, price_pence, fibre, summary, details, is_new, status, palette)
  values ('osari-heritage-saree', 'S2601', 'Heritage batik saree', 'sarees', array['avurudu','deepavali','temple']::text[], 8900, '100% cotton', 'Six metres of hand-waxed cotton with a deep border, for temple days, functions and New Year.', array['5.5 m saree + 0.8 m blouse piece (unstitched)','Wide hand-drawn border','Can be draped Kandyan or Indian style']::text[], false, 'active', array['#0D0F1E','#F7D287','#E4AC56']::text[])
  on conflict (code) do nothing
  returning id
)
insert into product_sizes (product_id, label, stock, position)
select p.id, s.label, 5, s.ord - 1 from p, unnest(array['One size']::text[]) with ordinality as s(label, ord);

with p as (
  insert into products (slug, code, name, category, occasions, price_pence, fibre, summary, details, is_new, status, palette)
  values ('mihiri-office-saree', 'S2602', 'Mihiri office saree', 'sarees', array['temple','gifts']::text[], 6900, '100% cotton', 'A lighter everyday saree with a small repeating leaf — easy to drape and easy to wash.', array['5.5 m saree + 0.8 m blouse piece (unstitched)','Light, breathable weave','Small all-over motif']::text[], false, 'active', array['#2F5D50','#FBF3E0','#0F1F44']::text[])
  on conflict (code) do nothing
  returning id
)
insert into product_sizes (product_id, label, stock, position)
select p.id, s.label, 5, s.ord - 1 from p, unnest(array['One size']::text[]) with ordinality as s(label, ord);

with p as (
  insert into products (slug, code, name, category, occasions, price_pence, fibre, summary, details, is_new, status, palette)
  values ('deepavali-silk-blend-saree', 'S2603', 'Deepavali festive saree', 'sarees', array['deepavali','eid']::text[], 9500, '60% viscose, 40% cotton', 'Rich plum and gold batik for festival evenings, with a hand-painted pallu.', array['5.5 m saree + 0.8 m blouse piece (unstitched)','Hand-painted pallu','Dry clean recommended']::text[], true, 'active', array['#5B1B3A','#E4AC56','#F7D287']::text[])
  on conflict (code) do nothing
  returning id
)
insert into product_sizes (product_id, label, stock, position)
select p.id, s.label, 5, s.ord - 1 from p, unnest(array['One size']::text[]) with ordinality as s(label, ord);

with p as (
  insert into products (slug, code, name, category, occasions, price_pence, fibre, summary, details, is_new, status, palette)
  values ('mens-cotton-sarong', 'R2601', 'Men''s batik sarong', 'sarongs', array['summer','gifts','temple']::text[], 2400, '100% cotton', 'The classic stitched tube sarong — soft, heavy cotton that gets better with every wash.', array['Stitched tube, approx. 2 m circumference','Fits waist up to 50 in','Wash separately the first time']::text[], false, 'active', array['#3B4C8A','#C48732','#FBF3E0']::text[])
  on conflict (code) do nothing
  returning id
)
insert into product_sizes (product_id, label, stock, position)
select p.id, s.label, 5, s.ord - 1 from p, unnest(array['One size']::text[]) with ordinality as s(label, ord);

with p as (
  insert into products (slug, code, name, category, occasions, price_pence, fibre, summary, details, is_new, status, palette)
  values ('beach-kaftan', 'T2601', 'Unawatuna kaftan', 'tops', array['summer','eid']::text[], 3900, '100% viscose', 'A floaty long kaftan that works as a beach cover-up or lounge piece at home.', array['Long, loose cut','Side splits','Fits UK 8–16 (S/M), 16–22 (L/XL)']::text[], false, 'active', array['#C48732','#FBF3E0','#2F5D50']::text[])
  on conflict (code) do nothing
  returning id
)
insert into product_sizes (product_id, label, stock, position)
select p.id, s.label, 5, s.ord - 1 from p, unnest(array['S/M','L/XL','XXL']::text[]) with ordinality as s(label, ord);

with p as (
  insert into products (slug, code, name, category, occasions, price_pence, fibre, summary, details, is_new, status, palette)
  values ('kurtha-top', 'T2602', 'Batik kurtha top', 'tops', array['eid','deepavali','summer']::text[], 3500, '100% cotton', 'A long-line kurtha with a batik yoke — pairs with jeans or palazzo trousers.', array['Thigh length','Three-quarter sleeves','Side slits']::text[], false, 'active', array['#FBF3E0','#0F1F44','#3B4C8A']::text[])
  on conflict (code) do nothing
  returning id
)
insert into product_sizes (product_id, label, stock, position)
select p.id, s.label, 5, s.ord - 1 from p, unnest(array['8','10','12','14','16','18','20']::text[]) with ordinality as s(label, ord);

with p as (
  insert into products (slug, code, name, category, occasions, price_pence, fibre, summary, details, is_new, status, palette)
  values ('kids-avurudu-frock', 'K2601', 'Kids'' batik frock', 'kids', array['avurudu','temple','gifts']::text[], 2200, '100% cotton', 'A twirl-ready frock for New Year games, school events and family photos.', array['Button back','Soft cotton lining','Machine washable at 30°']::text[], false, 'active', array['#E4AC56','#FBF3E0','#0F1F44']::text[])
  on conflict (code) do nothing
  returning id
)
insert into product_sizes (product_id, label, stock, position)
select p.id, s.label, 5, s.ord - 1 from p, unnest(array['2–3 yrs','4–5 yrs','6–7 yrs','8–9 yrs','10–11 yrs']::text[]) with ordinality as s(label, ord);

with p as (
  insert into products (slug, code, name, category, occasions, price_pence, fibre, summary, details, is_new, status, palette)
  values ('batik-scarf', 'A2601', 'Hand-waxed cotton scarf', 'accessories', array['gifts']::text[], 1800, '100% cotton', 'A light scarf with a crackle finish — the easiest gift from Sri Lanka.', array['180 × 70 cm','Hand-rolled edges','Arrives gift-wrapped']::text[], false, 'active', array['#0F1F44','#3B4C8A','#F7D287']::text[])
  on conflict (code) do nothing
  returning id
)
insert into product_sizes (product_id, label, stock, position)
select p.id, s.label, 5, s.ord - 1 from p, unnest(array['One size']::text[]) with ordinality as s(label, ord);

with p as (
  insert into products (slug, code, name, category, occasions, price_pence, fibre, summary, details, is_new, status, palette)
  values ('batik-fabric-metre', 'F2601', 'Batik fabric, per metre', 'fabric', array['gifts']::text[], 1400, '100% cotton', 'Hand-waxed cotton fabric for your own tailor — frocks, blouses, cushions and more.', array['112 cm wide','Cut as one continuous length','Pattern varies slightly by batch']::text[], false, 'active', array['#2F5D50','#E4AC56','#FBF3E0']::text[])
  on conflict (code) do nothing
  returning id
)
insert into product_sizes (product_id, label, stock, position)
select p.id, s.label, 5, s.ord - 1 from p, unnest(array['1 m','2 m','3 m','5 m']::text[]) with ordinality as s(label, ord);

