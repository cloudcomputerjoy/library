-- FCM Tokens Table
-- Stores FCM tokens for push notifications

CREATE TABLE IF NOT EXISTS fcm_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL UNIQUE,
  device_info TEXT,
  platform VARCHAR(50) DEFAULT 'android', -- 'android', 'ios', 'web'
  is_active BOOLEAN DEFAULT true,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT user_fcm_unique UNIQUE(user_id, fcm_token)
);

-- Notification Preferences Table
-- Stores user's notification preferences

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  push_notifications_enabled BOOLEAN DEFAULT true,
  due_date_reminders BOOLEAN DEFAULT true,
  overdue_notifications BOOLEAN DEFAULT true,
  fine_notifications BOOLEAN DEFAULT true,
  system_announcements BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT false,
  sms_notifications BOOLEAN DEFAULT false,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Sent Notifications Table
-- Logs all sent notifications

CREATE TABLE IF NOT EXISTS sent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  topic VARCHAR(255),
  title TEXT NOT NULL,
  body TEXT,
  notification_type VARCHAR(50), -- 'due_reminder', 'overdue', 'fine', 'system', 'test', 'topic', 'general'
  fcm_success_count INTEGER DEFAULT 0,
  fcm_failure_count INTEGER DEFAULT 0,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Topic Subscriptions Table
-- Tracks user subscriptions to notification topics

CREATE TABLE IF NOT EXISTS topic_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic VARCHAR(255) NOT NULL,
  is_subscribed BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT user_topic_unique UNIQUE(user_id, topic)
);

-- Create indexes for performance

CREATE INDEX idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX idx_fcm_tokens_active ON fcm_tokens(is_active) WHERE is_active = true;
CREATE INDEX idx_fcm_tokens_last_seen ON fcm_tokens(last_seen);
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_sent_notifications_user_id ON sent_notifications(user_id);
CREATE INDEX idx_sent_notifications_type ON sent_notifications(notification_type);
CREATE INDEX idx_sent_notifications_created_at ON sent_notifications(created_at);
CREATE INDEX idx_topic_subscriptions_user_id ON topic_subscriptions(user_id);
CREATE INDEX idx_topic_subscriptions_topic ON topic_subscriptions(topic) WHERE is_subscribed = true;

-- Enable RLS (Row Level Security)

ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for fcm_tokens

CREATE POLICY "Users can view their own FCM tokens" ON fcm_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own FCM tokens" ON fcm_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own FCM tokens" ON fcm_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own FCM tokens" ON fcm_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS Policies for notification_preferences

CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS Policies for sent_notifications

CREATE POLICY "Users can view their own sent notifications" ON sent_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sent notifications" ON sent_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS Policies for topic_subscriptions

CREATE POLICY "Users can view their own topic subscriptions" ON topic_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their topic subscriptions" ON topic_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their topic subscriptions" ON topic_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
