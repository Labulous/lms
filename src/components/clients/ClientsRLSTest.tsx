import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

export function ClientsRLSTest() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      
      // First check the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user:', user);
      
      if (userError) {
        console.error('Error getting user:', userError);
        toast.error('Failed to get current user');
        return;
      }

      // Now try to load clients
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Load clients response:', { data, error });

      if (error) {
        console.error('Error loading clients:', error);
        toast.error(`Failed to load clients - ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No clients found in database');
        toast.error('No clients available in database');
        setClients([]);
        return;
      }

      setClients(data);
      toast.success(`Successfully loaded ${data.length} clients`);
    } catch (error) {
      console.error('Error in loadClients:', error);
      toast.error(`Failed to load clients - ${error instanceof Error ? error.message : 'Unexpected error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testAddClient = async () => {
    try {
      setLoading(true);
      const newClient = {
        client_name: 'Test RLS Client',
        contact_name: 'Test Contact',
        phone: '555-0100',
        email: 'test@rls.com',
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip_code: '12345',
        clinic_registration_number: 'TEST123',
        notes: 'RLS Test Client',
        account_number: `TEST${Math.floor(Math.random() * 10000)}`
      };

      const { error } = await supabase
        .from('clients')
        .insert(newClient);

      if (error) {
        console.error('Error adding client:', error);
        toast.error(`Failed to add client - ${error.message}`);
        return;
      }

      toast.success('Client added successfully');
      await loadClients();
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error(`Failed to add client - ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testUpdateClient = async () => {
    if (clients.length === 0) {
      toast.error('No clients to update');
      return;
    }

    try {
      setLoading(true);
      const clientToUpdate = clients[0];
      
      // Check current user info
      const { data: userInfo, error: userInfoError } = await supabase
        .rpc('get_current_user_info');
      console.log('Current user info:', userInfo);
      
      if (userInfo?.[0]?.user_role !== 'admin') {
        toast.error('Permission denied: Only administrators can update clients');
        return;
      }

      const { data, error } = await supabase
        .from('clients')
        .update({
          contact_name: 'Updated Contact',
          notes: 'Updated by RLS test at ' + new Date().toISOString()
        })
        .eq('id', clientToUpdate.id)
        .select();

      console.log('Update response:', { data, error });

      if (error) {
        console.error('Error updating client:', error);
        toast.error(`Update failed: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No rows were updated - permissions denied');
        toast.error('Permission denied: Unable to update client');
        return;
      }

      toast.success('Client updated successfully');
      await loadClients();
    } catch (error: any) {
      console.error('Error updating client:', error);
      toast.error(`Update failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testDeleteClient = async () => {
    if (clients.length === 0) {
      toast.error('No clients to delete');
      return;
    }

    try {
      setLoading(true);
      const clientToDelete = clients[0];
      
      // Check current user info
      const { data: userInfo, error: userInfoError } = await supabase
        .rpc('get_current_user_info');
      console.log('Current user info:', userInfo);
      
      if (userInfo?.[0]?.user_role !== 'admin') {
        toast.error('Permission denied: Only administrators can delete clients');
        return;
      }

      const { data, error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete.id)
        .select();

      console.log('Delete response:', { data, error });

      if (error) {
        console.error('Error deleting client:', error);
        toast.error(`Delete failed: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No rows were deleted - permissions denied');
        toast.error('Permission denied: Unable to delete client');
        return;
      }

      toast.success('Client deleted successfully');
      await loadClients();
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast.error(`Delete failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    toast.success(`Current user: ${user?.email}`);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">RLS Policy Test</h2>
      
      <div className="space-x-2 mb-4">
        <button
          onClick={getCurrentUser}
          className="bg-gray-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Get Current User
        </button>
        <button
          onClick={testAddClient}
          className="bg-green-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Test Add Client
        </button>
        <button
          onClick={testUpdateClient}
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Test Update Client
        </button>
        <button
          onClick={testDeleteClient}
          className="bg-red-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Test Delete Client
        </button>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Current Clients:</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul className="space-y-2">
            {clients.map(client => (
              <li key={client.id} className="border p-2 rounded">
                <div><strong>Name:</strong> {client.client_name}</div>
                <div><strong>Contact:</strong> {client.contact_name}</div>
                <div><strong>Account:</strong> {client.account_number}</div>
                <div><strong>ID:</strong> {client.id}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
