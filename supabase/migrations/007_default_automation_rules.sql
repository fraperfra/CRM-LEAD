-- Add default automation rules for Follow-ups

INSERT INTO automation_rules (name, description, trigger_type, trigger_condition, actions, active) VALUES
(
    'FOLLOW-UP REMINDER',
    'Invia una notifica quando un follow-up è scaduto o in scadenza oggi',
    'follow_up_due',
    '{}',
    '[
        {"type": "notification", "notification_type": "follow_up", "title": "Follow-up in scadenza", "message": "{{lead_name}} richiede un follow-up oggi!", "priority": "high"}
    ]',
    true
);
