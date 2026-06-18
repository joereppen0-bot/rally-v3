-- ============================================================
-- Rally — seed data: 15 sample protest events
-- 5 cities (NYC, LA, Chicago, Austin, Seattle), all categories.
-- Seeded as status='approved' so the app looks live immediately.
-- Dates are relative to now() so they never go stale.
-- ============================================================

insert into public.events
  (name, cause_category, description, date, address, lat, lng, organiser_name, organiser_email, attendance_count, status)
values
-- ---------- New York City ----------
('March for Housing Justice', 'rights',
 'A peaceful march demanding affordable housing protections and a freeze on rent increases for stabilized units across the five boroughs.',
 now() + interval '3 days' + interval '11 hours', 'Foley Square, New York, NY', 40.7142, -74.0030,
 'NYC Tenants Union', 'organise@nyctenants.org', 1240, 'approved'),

('Clean Hudson Rally', 'environment',
 'Community rally calling for accelerated cleanup of PCB contamination in the Hudson River and stronger industrial discharge limits.',
 now() + interval '5 days' + interval '10 hours', 'Pier 45, Hudson River Park, New York, NY', 40.7340, -74.0110,
 'Riverkeeper Coalition', 'info@cleanhudson.org', 530, 'approved'),

('Transit Workers Solidarity', 'labour',
 'Subway and bus operators gather to support fair contract negotiations, safer working conditions, and protection against service cuts.',
 now() + interval '2 days' + interval '16 hours', 'Grand Central Terminal, New York, NY', 40.7527, -73.9772,
 'TWU Local 100 Members', 'contact@transitsolidarity.org', 880, 'approved'),

-- ---------- Los Angeles ----------
('Protect Public Schools', 'government',
 'Parents, teachers, and students rally against proposed district budget cuts that would eliminate arts and counseling programs.',
 now() + interval '4 days' + interval '9 hours', 'LA City Hall, 200 N Spring St, Los Angeles, CA', 34.0537, -118.2427,
 'United Parents LA', 'hello@protectlaschools.org', 670, 'approved'),

('Wildfire Resilience March', 'environment',
 'A march urging investment in wildfire prevention, forest management funding, and support for displaced residents.',
 now() + interval '6 days' + interval '10 hours', 'Pershing Square, Los Angeles, CA', 34.0480, -118.2517,
 'Climate Ready SoCal', 'team@climatereadysocal.org', 410, 'approved'),

('Gig Workers Rights Rally', 'labour',
 'Rideshare and delivery drivers demand minimum pay guarantees, transparent deactivation policies, and access to benefits.',
 now() + interval '1 day' + interval '12 hours', 'Echo Park Lake, Los Angeles, CA', 34.0726, -118.2606,
 'Rideshare Drivers United', 'organise@rdunited.org', 950, 'approved'),

('Disability Access Now', 'rights',
 'Advocates push for full ADA compliance across city transit and faster installation of accessible street crossings.',
 now() + interval '8 days' + interval '11 hours', 'Grand Park, Los Angeles, CA', 34.0561, -118.2454,
 'Access LA Collective', 'access@accessla.org', 320, 'approved'),

-- ---------- Chicago ----------
('Stop the Plant Closure', 'labour',
 'Steelworkers and community members rally to keep a manufacturing plant open and protect nearly 2,000 local jobs.',
 now() + interval '3 days' + interval '15 hours', 'Daley Plaza, 50 W Washington St, Chicago, IL', 41.8842, -87.6300,
 'United Steelworkers Local 1010', 'local1010@usw.org', 1100, 'approved'),

('Lake Michigan Water Defense', 'environment',
 'A rally to oppose new permits for shoreline industrial runoff and to protect the city drinking water supply.',
 now() + interval '7 days' + interval '10 hours', 'Millennium Park, Chicago, IL', 41.8826, -87.6226,
 'Great Lakes Guardians', 'defend@greatlakesguardians.org', 480, 'approved'),

('Police Accountability Vigil', 'government',
 'A peaceful vigil calling for an independent oversight board and release of body-camera footage policies.',
 now() + interval '2 days' + interval '18 hours', 'Federal Plaza, Chicago, IL', 41.8790, -87.6296,
 'Chicago Justice Network', 'vigil@chijustice.org', 760, 'approved'),

-- ---------- Austin ----------
('Reproductive Rights March', 'rights',
 'A march advocating for reproductive healthcare access and opposing new restrictions on clinics statewide.',
 now() + interval '5 days' + interval '11 hours', 'Texas State Capitol, 1100 Congress Ave, Austin, TX', 30.2747, -97.7404,
 'Texas Rights Alliance', 'march@txrights.org', 1320, 'approved'),

('Save Barton Springs', 'environment',
 'Locals gather to oppose upstream development threatening the aquifer that feeds Barton Springs.',
 now() + interval '9 days' + interval '9 hours', 'Zilker Park, Austin, TX', 30.2669, -97.7729,
 'Save Our Springs Alliance', 'info@savebarton.org', 290, 'approved'),

('Tech Layoffs Walkout', 'labour',
 'Tech workers stage a walkout demanding severance transparency and an end to surprise mass layoffs.',
 now() + interval '1 day' + interval '13 hours', 'Republic Square, Austin, TX', 30.2685, -97.7470,
 'Austin Tech Workers Coalition', 'walkout@atwc.org', 540, 'approved'),

-- ---------- Seattle ----------
('Open Government Data Rally', 'government',
 'Civic advocates push for open publication of city budget data and a stronger public records response standard.',
 now() + interval '4 days' + interval '12 hours', 'Seattle City Hall, 600 4th Ave, Seattle, WA', 47.6038, -122.3300,
 'Transparency Now WA', 'open@transparencywa.org', 230, 'approved'),

('Neighbourhood Safety Forum', 'other',
 'A community gathering to discuss pedestrian safety, street lighting, and traffic calming on busy corridors.',
 now() + interval '6 days' + interval '17 hours', 'Cal Anderson Park, Seattle, WA', 47.6172, -122.3190,
 'Capitol Hill Community Council', 'forum@chcouncil.org', 180, 'approved');
