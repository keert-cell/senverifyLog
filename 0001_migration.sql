DELETE FROM public.scans WHERE user_id IN (SELECT id FROM public.profiles WHERE phone='919876543210');
DELETE FROM auth.users WHERE email='919876543210@sensverify.app';