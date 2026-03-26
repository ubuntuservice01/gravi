import { supabase } from '../lib/supabase';

export const logAudit = async (
    userId,
    userName,
    action,
    tableName,
    recordId,
    newData = null,
    oldData = null
) => {
    try {
        const { error } = await supabase.from('audit_logs').insert([{
            user_id: userId,
            user_name: userName || 'Sistema',
            action,
            table_name: tableName,
            record_id: recordId,
            new_data: newData,
            old_data: oldData
        }]);

        if (error) {
            console.error('Audit Log Error:', error);
        }
    } catch (err) {
        console.error('Audit Log critical failure:', err);
    }
};
