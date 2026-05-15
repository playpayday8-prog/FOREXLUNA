const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const oldFunc = `        function addMTAccount() {
            const platform = document.getElementById('mt-platform').value;
            const server = document.getElementById('mt-server').value.trim();
            const login = document.getElementById('mt-login').value.trim();
            const password = document.getElementById('mt-password').value.trim();
            
            if (!server || !login || !password) {
                alert("Please fill all fields");
                return;
            }
            
            if (metaToken) {
                setTimeout(() => {
                    const newAccount = { id: Date.now(), platform, server, login };
                    
                    // Save to memory and localStorage (per user if logged in)
                    connectedAccount = newAccount;
                    savedAccounts.push(newAccount);
                    
                    if (currentUser) {
                        saveUserData();
                    } else {
                        safeStorage.setItem('saved_mt_accounts', JSON.stringify(savedAccounts));
                    }
                    
                    // Update UI
                    document.getElementById('meta-dot').className = "w-2 h-2 bg-emerald-400 rounded-full animate-pulse";
                    document.getElementById('meta-status-text').innerHTML = \`✅ \${platform.toUpperCase()}\`;
                    document.getElementById('connected-account').innerHTML = \`\${platform.toUpperCase()} • \${server} • \${login}\`;
                    document.getElementById('account-balance').innerHTML = \`$\${accountBalance.toLocaleString()}\`;
                    document.getElementById('meta-status-panel').classList.remove('hidden');
                    
                    renderSavedAccounts();
                    alert(\`✅ Account saved! \${platform.toUpperCase()} • \${login}\`);
                }, 600);
            } else {
                alert("⚠️ No MetaAPI token found. Go to Admin panel first.");
            }
        }`;

const newFunc = `        async function addMTAccount() {
            const platform = document.getElementById('mt-platform').value;
            const server = document.getElementById('mt-server').value.trim();
            const login = document.getElementById('mt-login').value.trim();
            const password = document.getElementById('mt-password').value.trim();
            
            if (!server || !login || !password) {
                alert("Please fill all fields");
                return;
            }
            
            try {
                const btn = document.querySelector('button[onclick="addMTAccount()"]');
                const origText = btn.textContent;
                btn.textContent = 'Connecting...';
                btn.disabled = true;

                const response = await fetch('/api/create-metaapi-account', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ platform, server, login, password })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to create account');
                }
                
                const newAccount = { 
                    id: data.accountId || Date.now(), 
                    platform, 
                    server, 
                    login,
                    connectionStatus: data.connectionStatus 
                };
                
                connectedAccount = newAccount;
                savedAccounts.push(newAccount);
                
                if (currentUser) {
                    saveUserData();
                } else {
                    safeStorage.setItem('saved_mt_accounts', JSON.stringify(savedAccounts));
                }
                
                document.getElementById('meta-dot').className = "w-2 h-2 bg-emerald-400 rounded-full animate-pulse";
                document.getElementById('meta-status-text').innerHTML = \`✅ \${platform.toUpperCase()}\`;
                document.getElementById('connected-account').innerHTML = \`\${platform.toUpperCase()} • \${server} • \${login}\`;
                document.getElementById('account-balance').innerHTML = \`$\${accountBalance.toLocaleString()}\`;
                document.getElementById('meta-status-panel').classList.remove('hidden');
                
                renderSavedAccounts();
                alert("✅ Account created successfully in MetaAPI!");
                
                btn.textContent = origText;
                btn.disabled = false;
            } catch (err) {
                alert("⚠️ Error: " + err.message);
                const btn = document.querySelector('button[onclick="addMTAccount()"]');
                btn.textContent = 'Create & Connect Account';
                btn.disabled = false;
            }
        }`;

if (html.includes(oldFunc)) {
    html = html.replace(oldFunc, newFunc);
    fs.writeFileSync('index.html', html);
    console.log('Successfully updated addMTAccount');
} else {
    console.log('Could not find oldFunc in index.html');
}
