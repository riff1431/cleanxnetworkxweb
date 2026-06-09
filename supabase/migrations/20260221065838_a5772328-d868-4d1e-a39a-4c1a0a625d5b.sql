
-- Add foreign key from reviews.reviewer_id to profiles.id
ALTER TABLE public.reviews
ADD CONSTRAINT reviews_reviewer_id_fkey
FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id);
