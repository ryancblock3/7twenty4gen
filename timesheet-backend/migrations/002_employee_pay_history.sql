-- Create employee_pay_history table
CREATE TABLE IF NOT EXISTS employee_pay_history (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  regular_rate NUMERIC(10, 2) NOT NULL,
  overtime_rate NUMERIC(10, 2) NOT NULL,
  effective_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  CONSTRAINT unique_employee_date UNIQUE (employee_id, effective_date)
);

-- Create index for faster lookups
CREATE INDEX idx_employee_pay_history_employee_id ON employee_pay_history(employee_id);
CREATE INDEX idx_employee_pay_history_effective_date ON employee_pay_history(effective_date);

-- Function to automatically record pay rate changes
CREATE OR REPLACE FUNCTION record_employee_pay_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert a record if the rates have changed
  IF (TG_OP = 'UPDATE' AND (OLD.regular_rate <> NEW.regular_rate OR OLD.overtime_rate <> NEW.overtime_rate)) OR TG_OP = 'INSERT' THEN
    INSERT INTO employee_pay_history (employee_id, regular_rate, overtime_rate, effective_date)
    VALUES (NEW.id, NEW.regular_rate, NEW.overtime_rate, CURRENT_DATE);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to record pay rate changes when an employee is created or updated
DROP TRIGGER IF EXISTS employee_pay_change_trigger ON employees;
CREATE TRIGGER employee_pay_change_trigger
AFTER INSERT OR UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION record_employee_pay_change();
