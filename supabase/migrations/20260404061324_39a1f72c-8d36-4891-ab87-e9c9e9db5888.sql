
-- ==========================================
-- 1. Users table
-- ==========================================
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  email       VARCHAR(255) NOT NULL UNIQUE,
  role        VARCHAR(10)  NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  status      VARCHAR(10)  NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned')),
  avatar_url  TEXT,
  phone       VARCHAR(20),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_email ON users(email);

-- ==========================================
-- 2. Subjects
-- ==========================================
CREATE TABLE public.subjects (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  thumbnail   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_subjects_active ON subjects(is_active);

-- ==========================================
-- 3. Categories
-- ==========================================
CREATE TABLE public.categories (
  id          SERIAL PRIMARY KEY,
  subject_id  INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(subject_id, name)
);
CREATE INDEX idx_categories_subject ON categories(subject_id);

-- ==========================================
-- 4. Theory Sections
-- ==========================================
CREATE TABLE public.theory_sections (
  id           SERIAL PRIMARY KEY,
  subject_id   INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  content      TEXT,
  order_index  INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_theory_subject ON theory_sections(subject_id);
CREATE INDEX idx_theory_published ON theory_sections(is_published);

-- ==========================================
-- 5. Exams
-- ==========================================
CREATE TABLE public.exams (
  id               SERIAL PRIMARY KEY,
  title            VARCHAR(200) NOT NULL,
  subject_id       INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  category_id      INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  description      TEXT,
  duration_minutes INTEGER,
  is_published     BOOLEAN NOT NULL DEFAULT FALSE,
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_exams_subject ON exams(subject_id);
CREATE INDEX idx_exams_category ON exams(category_id);
CREATE INDEX idx_exams_published ON exams(is_published);

-- ==========================================
-- 6. Questions
-- ==========================================
CREATE TABLE public.questions (
  id            SERIAL PRIMARY KEY,
  exam_id       INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT,
  image_url     TEXT,
  order_index   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_question_content CHECK (question_text IS NOT NULL OR image_url IS NOT NULL)
);
CREATE INDEX idx_questions_exam ON questions(exam_id);
CREATE INDEX idx_questions_order ON questions(exam_id, order_index);

-- ==========================================
-- 7. Answers
-- ==========================================
CREATE TABLE public.answers (
  id           SERIAL PRIMARY KEY,
  question_id  INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label        CHAR(1) NOT NULL CHECK (label IN ('A','B','C','D','E','F','G','H')),
  content      TEXT,
  is_correct   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(question_id, label)
);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_answers_correct ON answers(question_id, is_correct);

-- ==========================================
-- 8. Attempts
-- ==========================================
CREATE TABLE public.attempts (
  id              SERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_id         INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  score           NUMERIC(4,2),
  total_questions INTEGER,
  correct_count   INTEGER,
  status          VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'timed_out')),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at    TIMESTAMPTZ,
  CONSTRAINT chk_score CHECK (score >= 0 AND score <= 10)
);
CREATE INDEX idx_attempts_user ON attempts(user_id);
CREATE INDEX idx_attempts_exam ON attempts(exam_id);
CREATE INDEX idx_attempts_status ON attempts(status);
CREATE INDEX idx_attempts_score ON attempts(score DESC);

-- ==========================================
-- 9. Attempt Answers
-- ==========================================
CREATE TABLE public.attempt_answers (
  id          SERIAL PRIMARY KEY,
  attempt_id  INTEGER NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_id   INTEGER REFERENCES answers(id) ON DELETE SET NULL,
  is_correct  BOOLEAN,
  UNIQUE(attempt_id, question_id)
);
CREATE INDEX idx_attempt_answers_attempt ON attempt_answers(attempt_id);
CREATE INDEX idx_attempt_answers_question ON attempt_answers(question_id);

-- ==========================================
-- 10. User Permissions
-- ==========================================
CREATE TABLE public.user_permissions (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id  INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  granted_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,
  UNIQUE(user_id, subject_id)
);
CREATE INDEX idx_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_permissions_subject ON user_permissions(subject_id);
CREATE INDEX idx_permissions_expires ON user_permissions(expires_at);

-- ==========================================
-- 11. Plans
-- ==========================================
CREATE TABLE public.plans (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  subject_id    INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  price         NUMERIC(12,0) NOT NULL,
  duration_days INTEGER NOT NULL,
  description   TEXT,
  features      JSONB,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_plans_subject ON plans(subject_id);
CREATE INDEX idx_plans_active ON plans(is_active);

-- ==========================================
-- 12. Orders
-- ==========================================
CREATE TABLE public.orders (
  id            SERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_price   NUMERIC(12,0) NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  note          TEXT,
  payment_proof TEXT,
  reviewed_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ==========================================
-- 13. Order Items
-- ==========================================
CREATE TABLE public.order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  plan_id    INTEGER NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  quantity   INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,0) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_plan ON order_items(plan_id);

-- ==========================================
-- 14. User Subscriptions (no generated column - use query instead)
-- ==========================================
CREATE TABLE public.user_subscriptions (
  id           SERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id   INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  order_id     INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  start_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date     DATE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_subscriptions_subject ON user_subscriptions(subject_id);
CREATE INDEX idx_subscriptions_end ON user_subscriptions(end_date);

-- ==========================================
-- Helper functions
-- ==========================================
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.users WHERE id = _user_id AND role = 'admin') $$;

CREATE OR REPLACE FUNCTION public.has_subject_access(_user_id uuid, _subject_id integer)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions WHERE user_id = _user_id AND subject_id = _subject_id AND (expires_at IS NULL OR expires_at > NOW())
    UNION
    SELECT 1 FROM public.user_subscriptions WHERE user_id = _user_id AND subject_id = _subject_id AND end_date >= CURRENT_DATE
  )
$$;

-- ==========================================
-- Triggers
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_theory_updated_at BEFORE UPDATE ON public.theory_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Order paid trigger
CREATE OR REPLACE FUNCTION handle_order_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    INSERT INTO user_subscriptions (user_id, subject_id, order_id, start_date, end_date)
    SELECT NEW.user_id, p.subject_id, NEW.id, CURRENT_DATE, CURRENT_DATE + p.duration_days
    FROM order_items oi JOIN plans p ON p.id = oi.plan_id
    WHERE oi.order_id = NEW.id AND p.subject_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_paid AFTER UPDATE OF status ON orders FOR EACH ROW EXECUTE FUNCTION handle_order_paid();

-- ==========================================
-- RLS
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()));
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id OR public.is_admin(auth.uid()));

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects_select" ON public.subjects FOR SELECT USING (is_active = true OR public.is_admin(auth.uid()));
CREATE POLICY "subjects_insert" ON public.subjects FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "subjects_update" ON public.subjects FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "subjects_delete" ON public.subjects FOR DELETE USING (public.is_admin(auth.uid()));

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_insert" ON public.categories FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "categories_update" ON public.categories FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "categories_delete" ON public.categories FOR DELETE USING (public.is_admin(auth.uid()));

ALTER TABLE public.theory_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "theory_select" ON public.theory_sections FOR SELECT USING (is_published = true OR public.is_admin(auth.uid()));
CREATE POLICY "theory_insert" ON public.theory_sections FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "theory_update" ON public.theory_sections FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "theory_delete" ON public.theory_sections FOR DELETE USING (public.is_admin(auth.uid()));

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exams_select" ON public.exams FOR SELECT USING (is_published = true OR public.is_admin(auth.uid()));
CREATE POLICY "exams_insert" ON public.exams FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "exams_update" ON public.exams FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "exams_delete" ON public.exams FOR DELETE USING (public.is_admin(auth.uid()));

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_select" ON public.questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM exams WHERE exams.id = exam_id AND (exams.is_published = true OR public.is_admin(auth.uid())))
);
CREATE POLICY "questions_insert" ON public.questions FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "questions_update" ON public.questions FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "questions_delete" ON public.questions FOR DELETE USING (public.is_admin(auth.uid()));

ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "answers_select" ON public.answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM questions q JOIN exams e ON e.id = q.exam_id WHERE q.id = question_id AND (e.is_published = true OR public.is_admin(auth.uid())))
);
CREATE POLICY "answers_insert" ON public.answers FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "answers_update" ON public.answers FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "answers_delete" ON public.answers FOR DELETE USING (public.is_admin(auth.uid()));

ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempts_select" ON public.attempts FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "attempts_insert" ON public.attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "attempts_update" ON public.attempts FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempt_answers_select" ON public.attempt_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM attempts WHERE attempts.id = attempt_id AND (attempts.user_id = auth.uid() OR public.is_admin(auth.uid())))
);
CREATE POLICY "attempt_answers_insert" ON public.attempt_answers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM attempts WHERE attempts.id = attempt_id AND attempts.user_id = auth.uid())
);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permissions_select" ON public.user_permissions FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "permissions_insert" ON public.user_permissions FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "permissions_update" ON public.user_permissions FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "permissions_delete" ON public.user_permissions FOR DELETE USING (public.is_admin(auth.uid()));

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_select" ON public.plans FOR SELECT USING (is_active = true OR public.is_admin(auth.uid()));
CREATE POLICY "plans_insert" ON public.plans FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "plans_update" ON public.plans FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "plans_delete" ON public.plans FOR DELETE USING (public.is_admin(auth.uid()));

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_select" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_update" ON public.orders FOR UPDATE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND (orders.user_id = auth.uid() OR public.is_admin(auth.uid())))
);
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = auth.uid())
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_select" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "subscriptions_insert" ON public.user_subscriptions FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- ==========================================
-- Storage
-- ==========================================
INSERT INTO storage.buckets (id, name, public) VALUES ('question-images', 'question-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false);

CREATE POLICY "question_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'question-images');
CREATE POLICY "question_images_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'question-images' AND public.is_admin(auth.uid()));
CREATE POLICY "question_images_delete" ON storage.objects FOR DELETE USING (bucket_id = 'question-images' AND public.is_admin(auth.uid()));
CREATE POLICY "payment_proofs_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid() IS NOT NULL);
CREATE POLICY "payment_proofs_select_own" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin(auth.uid())));
