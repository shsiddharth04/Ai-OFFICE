export async function testPost() {
  const response = await fetch('https://httpbin.org/post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Hello from AI Studio',
    }),
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return await response.json();
}

export async function generateRoleResponse(roleId: string, userMessage: string) {
  const response = await fetch('https://gcnzboujpptdxgvawbdw.supabase.co/functions/v1/generate-role-response', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjbnpib3VqcHB0ZHhndmF3YmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDIzMDAsImV4cCI6MjA4NzYxODMwMH0.MwsLJJXzpp7uVFISu9uSea7k75m1WVFC_CB7TUUCRY4',
    },
    body: JSON.stringify({
      role_id: roleId,
      user_message: userMessage,
    }),
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return await response.json();
}
