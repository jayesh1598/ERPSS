import type { Context } from 'npm:hono';
import * as kv from './kv_store.tsx';

// ============================================
// ACCOUNTING MODULE - Server Routes
// Complete Accounting System
// ============================================

/**
 * Initialize predefined account groups
 * Called during app initialization
 */
export async function initializeAccountGroups() {
  console.log('📊 Initializing predefined account groups...');
  
  const predefinedGroups = [
    // Assets
    { id: 'group-current-assets', name: 'Current Assets', parent_id: null, type: 'asset', is_predefined: true, nature: 'debit' },
    { id: 'group-fixed-assets', name: 'Fixed Assets', parent_id: null, type: 'asset', is_predefined: true, nature: 'debit' },
    { id: 'group-bank-accounts', name: 'Bank Accounts', parent_id: 'group-current-assets', type: 'asset', is_predefined: true, nature: 'debit' },
    { id: 'group-cash-in-hand', name: 'Cash-in-Hand', parent_id: 'group-current-assets', type: 'asset', is_predefined: true, nature: 'debit' },
    { id: 'group-sundry-debtors', name: 'Sundry Debtors', parent_id: 'group-current-assets', type: 'asset', is_predefined: true, nature: 'debit' },
    { id: 'group-stock-in-hand', name: 'Stock-in-Hand', parent_id: 'group-current-assets', type: 'asset', is_predefined: true, nature: 'debit' },
    
    // Liabilities
    { id: 'group-current-liabilities', name: 'Current Liabilities', parent_id: null, type: 'liability', is_predefined: true, nature: 'credit' },
    { id: 'group-sundry-creditors', name: 'Sundry Creditors', parent_id: 'group-current-liabilities', type: 'liability', is_predefined: true, nature: 'credit' },
    { id: 'group-duties-taxes', name: 'Duties & Taxes', parent_id: 'group-current-liabilities', type: 'liability', is_predefined: true, nature: 'credit' },
    { id: 'group-loans-liability', name: 'Loans (Liability)', parent_id: 'group-current-liabilities', type: 'liability', is_predefined: true, nature: 'credit' },
    
    // Income
    { id: 'group-sales-accounts', name: 'Sales Accounts', parent_id: null, type: 'income', is_predefined: true, nature: 'credit' },
    { id: 'group-indirect-income', name: 'Indirect Incomes', parent_id: null, type: 'income', is_predefined: true, nature: 'credit' },
    
    // Expenses
    { id: 'group-purchase-accounts', name: 'Purchase Accounts', parent_id: null, type: 'expense', is_predefined: true, nature: 'debit' },
    { id: 'group-direct-expenses', name: 'Direct Expenses', parent_id: null, type: 'expense', is_predefined: true, nature: 'debit' },
    { id: 'group-indirect-expenses', name: 'Indirect Expenses', parent_id: null, type: 'expense', is_predefined: true, nature: 'debit' },
    
    // Capital
    { id: 'group-capital-account', name: 'Capital Account', parent_id: null, type: 'capital', is_predefined: true, nature: 'credit' },
    { id: 'group-reserves-surplus', name: 'Reserves & Surplus', parent_id: null, type: 'capital', is_predefined: true, nature: 'credit' },
  ];

  for (const group of predefinedGroups) {
    await kv.set(`account_group:${group.id}`, group);
  }

  console.log(`✅ Initialized ${predefinedGroups.length} predefined account groups`);
}

// ============================================
// ACCOUNT GROUPS
// ============================================

export async function getAccountGroups(c: Context) {
  console.log('📊 Fetching account groups...');
  
  const groups = await kv.getByPrefix('account_group:');
  
  return c.json(groups);
}

export async function createAccountGroup(c: Context) {
  const { name, parent_id, type } = await c.req.json();
  
  if (!name || !type) {
    return c.json({ error: 'Name and type are required' }, 400);
  }

  // Validate type
  const validTypes = ['asset', 'liability', 'income', 'expense', 'capital'];
  if (!validTypes.includes(type)) {
    return c.json({ error: 'Invalid type' }, 400);
  }

  // Determine nature based on type
  const natureMap: Record<string, 'debit' | 'credit'> = {
    asset: 'debit',
    expense: 'debit',
    liability: 'credit',
    income: 'credit',
    capital: 'credit',
  };

  const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const group = {
    id: groupId,
    name,
    parent_id: parent_id || null,
    type,
    nature: natureMap[type],
    is_predefined: false,
    created_at: new Date().toISOString(),
  };

  await kv.set(`account_group:${groupId}`, group);

  console.log(`✅ Created account group: ${name} (${type})`);

  return c.json({ success: true, group });
}

export async function updateAccountGroup(c: Context) {
  const groupId = c.req.param('id');
  const updates = await c.req.json();

  const existingGroup = await kv.get(`account_group:${groupId}`);
  
  if (!existingGroup) {
    return c.json({ error: 'Group not found' }, 404);
  }

  if (existingGroup.is_predefined) {
    return c.json({ error: 'Cannot modify predefined group' }, 403);
  }

  const updatedGroup = {
    ...existingGroup,
    ...updates,
    id: groupId, // Ensure ID doesn't change
    is_predefined: existingGroup.is_predefined, // Ensure this doesn't change
    updated_at: new Date().toISOString(),
  };

  await kv.set(`account_group:${groupId}`, updatedGroup);

  console.log(`✅ Updated account group: ${groupId}`);

  return c.json({ success: true, group: updatedGroup });
}

export async function deleteAccountGroup(c: Context) {
  const groupId = c.req.param('id');

  const group = await kv.get(`account_group:${groupId}`);
  
  if (!group) {
    return c.json({ error: 'Group not found' }, 404);
  }

  if (group.is_predefined) {
    return c.json({ error: 'Cannot delete predefined group' }, 403);
  }

  // Check if any ledgers belong to this group
  const allLedgers = await kv.getByPrefix('account_ledger:');
  const ledgersInGroup = allLedgers.filter((l: any) => l.group_id === groupId);
  
  if (ledgersInGroup.length > 0) {
    return c.json({ error: `Cannot delete group: ${ledgersInGroup.length} ledger(s) belong to this group` }, 400);
  }

  // Check if any child groups exist
  const allGroups = await kv.getByPrefix('account_group:');
  const childGroups = allGroups.filter((g: any) => g.parent_id === groupId);
  
  if (childGroups.length > 0) {
    return c.json({ error: `Cannot delete group: ${childGroups.length} sub-group(s) exist` }, 400);
  }

  await kv.del(`account_group:${groupId}`);

  console.log(`✅ Deleted account group: ${groupId}`);

  return c.json({ success: true });
}

// ============================================
// LEDGERS
// ============================================

export async function getAccountLedgers(c: Context) {
  console.log('📊 Fetching account ledgers...');
  
  const ledgers = await kv.getByPrefix('account_ledger:');
  
  // Calculate current balance for each ledger from voucher entries
  for (const ledger of ledgers) {
    ledger.current_balance = await calculateLedgerBalance(ledger.id);
  }
  
  return c.json(ledgers);
}

export async function getAccountLedger(c: Context) {
  const ledgerId = c.req.param('id');
  
  const ledger = await kv.get(`account_ledger:${ledgerId}`);
  
  if (!ledger) {
    return c.json({ error: 'Ledger not found' }, 404);
  }

  // Calculate current balance
  ledger.current_balance = await calculateLedgerBalance(ledgerId);
  
  return c.json(ledger);
}

export async function createAccountLedger(c: Context) {
  const data = await c.req.json();
  
  const {
    name,
    group_id,
    opening_balance = 0,
    opening_balance_type = 'debit',
    is_bank_account = false,
    bank_name,
    account_number,
    ifsc_code,
    enable_gst = false,
    gstin,
    pan,
    address,
    contact_person,
    phone,
    email,
  } = data;

  if (!name || !group_id) {
    return c.json({ error: 'Name and group are required' }, 400);
  }

  // Validate group exists
  const group = await kv.get(`account_group:${group_id}`);
  if (!group) {
    return c.json({ error: 'Invalid group ID' }, 400);
  }

  // Validate GST if enabled
  if (enable_gst && !gstin) {
    return c.json({ error: 'GSTIN required when GST is enabled' }, 400);
  }

  const ledgerId = `ledger-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const ledger = {
    id: ledgerId,
    name,
    group_id,
    group_name: group.name,
    opening_balance: parseFloat(opening_balance),
    opening_balance_type,
    current_balance: parseFloat(opening_balance), // Will be calculated from transactions
    is_bank_account,
    bank_name: is_bank_account ? bank_name : null,
    account_number: is_bank_account ? account_number : null,
    ifsc_code: is_bank_account ? ifsc_code : null,
    enable_gst,
    gstin: enable_gst ? gstin : null,
    pan: enable_gst ? pan : null,
    address: enable_gst ? address : null,
    contact_person,
    phone,
    email,
    created_at: new Date().toISOString(),
  };

  await kv.set(`account_ledger:${ledgerId}`, ledger);

  console.log(`✅ Created ledger: ${name} under ${group.name}`);

  return c.json({ success: true, ledger });
}

export async function updateAccountLedger(c: Context) {
  const ledgerId = c.req.param('id');
  const updates = await c.req.json();

  const existingLedger = await kv.get(`account_ledger:${ledgerId}`);
  
  if (!existingLedger) {
    return c.json({ error: 'Ledger not found' }, 404);
  }

  // If group is being changed, validate it
  if (updates.group_id && updates.group_id !== existingLedger.group_id) {
    const group = await kv.get(`account_group:${updates.group_id}`);
    if (!group) {
      return c.json({ error: 'Invalid group ID' }, 400);
    }
    updates.group_name = group.name;
  }

  const updatedLedger = {
    ...existingLedger,
    ...updates,
    id: ledgerId,
    updated_at: new Date().toISOString(),
  };

  await kv.set(`account_ledger:${ledgerId}`, updatedLedger);

  console.log(`✅ Updated ledger: ${ledgerId}`);

  return c.json({ success: true, ledger: updatedLedger });
}

export async function deleteAccountLedger(c: Context) {
  const ledgerId = c.req.param('id');

  const ledger = await kv.get(`account_ledger:${ledgerId}`);
  
  if (!ledger) {
    return c.json({ error: 'Ledger not found' }, 404);
  }

  // Check if any voucher entries reference this ledger
  const allVouchers = await kv.getByPrefix('accounting_voucher:');
  const hasTransactions = allVouchers.some((v: any) =>
    v.entries?.some((e: any) => e.ledger_id === ledgerId)
  );
  
  if (hasTransactions) {
    return c.json({ error: 'Cannot delete ledger: transactions exist' }, 400);
  }

  await kv.del(`account_ledger:${ledgerId}`);

  console.log(`✅ Deleted ledger: ${ledgerId}`);

  return c.json({ success: true });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function calculateLedgerBalance(ledgerId: string): Promise<number> {
  const ledger = await kv.get(`account_ledger:${ledgerId}`);
  if (!ledger) return 0;

  // Start with opening balance
  let balance = ledger.opening_balance || 0;
  if (ledger.opening_balance_type === 'credit') {
    balance = -balance; // Credit balances are negative in accounting
  }

  // Get all voucher entries for this ledger
  const allVouchers = await kv.getByPrefix('accounting_voucher:');
  
  for (const voucher of allVouchers) {
    if (voucher.status === 'cancelled') continue;
    
    for (const entry of voucher.entries || []) {
      if (entry.ledger_id === ledgerId) {
        if (entry.type === 'debit') {
          balance += entry.amount;
        } else {
          balance -= entry.amount;
        }
      }
    }
  }

  return balance;
}

export function getNatureFromGroup(group: any): 'debit' | 'credit' {
  // Assets and Expenses are debit nature
  // Liabilities, Income, and Capital are credit nature
  if (group.type === 'asset' || group.type === 'expense') {
    return 'debit';
  }
  return 'credit';
}

// ============================================
// VOUCHERS
// ============================================

export async function getVouchers(c: Context) {
  console.log('📊 Fetching vouchers...');
  
  const vouchers = await kv.getByPrefix('accounting_voucher:');
  
  // Sort by date descending
  vouchers.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return c.json(vouchers);
}

export async function getVoucher(c: Context) {
  const voucherId = c.req.param('id');
  
  const voucher = await kv.get(`accounting_voucher:${voucherId}`);
  
  if (!voucher) {
    return c.json({ error: 'Voucher not found' }, 404);
  }
  
  return c.json(voucher);
}

export async function createVoucher(c: Context) {
  const data = await c.req.json();
  
  const {
    voucher_type,
    date,
    reference_number,
    entries,
    narration,
    status = 'posted',
  } = data;

  // Validation
  if (!voucher_type || !date || !entries || entries.length < 2) {
    return c.json({ error: 'Invalid voucher data' }, 400);
  }

  // Validate voucher type
  const validTypes = ['payment', 'receipt', 'journal', 'contra', 'sales', 'purchase'];
  if (!validTypes.includes(voucher_type)) {
    return c.json({ error: 'Invalid voucher type' }, 400);
  }

  // Validate all entries have ledgers and amounts
  for (const entry of entries) {
    if (!entry.ledger_id || !entry.amount || entry.amount <= 0) {
      return c.json({ error: 'All entries must have valid ledger and amount' }, 400);
    }

    // Verify ledger exists
    const ledger = await kv.get(`account_ledger:${entry.ledger_id}`);
    if (!ledger) {
      return c.json({ error: `Ledger not found: ${entry.ledger_id}` }, 400);
    }
  }

  // Validate double-entry (debits = credits)
  const debitTotal = entries.filter((e: any) => e.type === 'debit').reduce((sum: number, e: any) => sum + e.amount, 0);
  const creditTotal = entries.filter((e: any) => e.type === 'credit').reduce((sum: number, e: any) => sum + e.amount, 0);

  if (Math.abs(debitTotal - creditTotal) > 0.01) {
    return c.json({ 
      error: `Double-entry validation failed: Debits (${debitTotal}) must equal Credits (${creditTotal})` 
    }, 400);
  }

  // Generate voucher number
  const allVouchers = await kv.getByPrefix('accounting_voucher:');
  const typeVouchers = allVouchers.filter((v: any) => v.voucher_type === voucher_type);
  const voucherNumber = `${voucher_type.toUpperCase().substring(0, 3)}/${new Date(date).getFullYear()}/${String(typeVouchers.length + 1).padStart(4, '0')}`;

  const voucherId = `voucher-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const voucher = {
    id: voucherId,
    voucher_type,
    voucher_number: voucherNumber,
    date,
    reference_number,
    entries,
    total_amount: debitTotal,
    narration,
    status,
    created_at: new Date().toISOString(),
  };

  await kv.set(`accounting_voucher:${voucherId}`, voucher);

  console.log(`✅ Created voucher: ${voucherNumber} (${voucher_type}) - ₹${debitTotal}`);

  return c.json({ success: true, voucher });
}

export async function updateVoucher(c: Context) {
  const voucherId = c.req.param('id');
  const updates = await c.req.json();

  const existingVoucher = await kv.get(`accounting_voucher:${voucherId}`);
  
  if (!existingVoucher) {
    return c.json({ error: 'Voucher not found' }, 404);
  }

  if (existingVoucher.status === 'posted') {
    return c.json({ error: 'Cannot modify posted voucher' }, 403);
  }

  // If entries are being updated, validate them
  if (updates.entries) {
    // Validate all entries have ledgers and amounts
    for (const entry of updates.entries) {
      if (!entry.ledger_id || !entry.amount || entry.amount <= 0) {
        return c.json({ error: 'All entries must have valid ledger and amount' }, 400);
      }
    }

    // Validate double-entry
    const debitTotal = updates.entries.filter((e: any) => e.type === 'debit').reduce((sum: number, e: any) => sum + e.amount, 0);
    const creditTotal = updates.entries.filter((e: any) => e.type === 'credit').reduce((sum: number, e: any) => sum + e.amount, 0);

    if (Math.abs(debitTotal - creditTotal) > 0.01) {
      return c.json({ 
        error: `Double-entry validation failed: Debits (${debitTotal}) must equal Credits (${creditTotal})` 
      }, 400);
    }

    updates.total_amount = debitTotal;
  }

  const updatedVoucher = {
    ...existingVoucher,
    ...updates,
    id: voucherId,
    updated_at: new Date().toISOString(),
  };

  await kv.set(`accounting_voucher:${voucherId}`, updatedVoucher);

  console.log(`✅ Updated voucher: ${voucherId}`);

  return c.json({ success: true, voucher: updatedVoucher });
}

export async function deleteVoucher(c: Context) {
  const voucherId = c.req.param('id');

  const voucher = await kv.get(`accounting_voucher:${voucherId}`);
  
  if (!voucher) {
    return c.json({ error: 'Voucher not found' }, 404);
  }

  if (voucher.status === 'posted') {
    return c.json({ error: 'Cannot delete posted voucher. Cancel it first.' }, 403);
  }

  await kv.del(`accounting_voucher:${voucherId}`);

  console.log(`✅ Deleted voucher: ${voucherId}`);

  return c.json({ success: true });
}

// ============================================
// BANK RECONCILIATION
// ============================================

export async function getBankStatements(c: Context) {
  console.log('🏦 Fetching bank statements...');
  
  const bankLedgerId = c.req.query('bank_ledger_id');
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');
  
  if (!bankLedgerId) {
    return c.json({ error: 'Bank ledger ID is required' }, 400);
  }
  
  const allStatements = await kv.getByPrefix('bank_statement:');
  
  let statements = allStatements.filter((s: any) => s.bank_ledger_id === bankLedgerId);
  
  // Filter by date range if provided
  if (startDate && endDate) {
    statements = statements.filter((s: any) => {
      const txnDate = new Date(s.transaction_date);
      return txnDate >= new Date(startDate) && txnDate <= new Date(endDate);
    });
  }
  
  // Sort by transaction date
  statements.sort((a: any, b: any) => 
    new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
  );
  
  console.log(`✅ Found ${statements.length} bank statements`);
  
  return c.json(statements);
}

export async function createBankStatement(c: Context) {
  const data = await c.req.json();
  
  const statementId = `stmt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const statement = {
    id: statementId,
    bank_ledger_id: data.bank_ledger_id,
    date: new Date().toISOString().split('T')[0],
    transaction_date: data.transaction_date,
    description: data.description,
    reference_number: data.reference_number || '',
    debit: parseFloat(data.debit) || 0,
    credit: parseFloat(data.credit) || 0,
    balance: parseFloat(data.balance) || 0,
    reconciled: false,
    voucher_id: null,
    created_at: new Date().toISOString(),
  };
  
  await kv.set(`bank_statement:${statementId}`, statement);
  
  console.log(`✅ Created bank statement: ${statementId}`);
  
  return c.json(statement);
}

export async function updateBankStatement(c: Context) {
  const statementId = c.req.param('id');
  const updates = await c.req.json();
  
  const statement = await kv.get(`bank_statement:${statementId}`);
  
  if (!statement) {
    return c.json({ error: 'Bank statement not found' }, 404);
  }
  
  const updated = {
    ...statement,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  
  await kv.set(`bank_statement:${statementId}`, updated);
  
  console.log(`✅ Updated bank statement: ${statementId}`);
  
  return c.json(updated);
}

export async function deleteBankStatement(c: Context) {
  const statementId = c.req.param('id');
  
  const statement = await kv.get(`bank_statement:${statementId}`);
  
  if (!statement) {
    return c.json({ error: 'Bank statement not found' }, 404);
  }
  
  if (statement.reconciled) {
    return c.json({ error: 'Cannot delete reconciled statement. Unmatch it first.' }, 403);
  }
  
  await kv.del(`bank_statement:${statementId}`);
  
  console.log(`✅ Deleted bank statement: ${statementId}`);
  
  return c.json({ success: true });
}

export async function matchTransactions(c: Context) {
  const data = await c.req.json();
  
  const { statement_ids, voucher_ids } = data;
  
  if (!statement_ids || !voucher_ids) {
    return c.json({ error: 'Statement IDs and Voucher IDs are required' }, 400);
  }
  
  // Mark statements as reconciled
  for (const stmtId of statement_ids) {
    const statement = await kv.get(`bank_statement:${stmtId}`);
    if (statement) {
      statement.reconciled = true;
      statement.matched_at = new Date().toISOString();
      await kv.set(`bank_statement:${stmtId}`, statement);
    }
  }
  
  console.log(`✅ Matched ${statement_ids.length} statements with ${voucher_ids.length} vouchers`);
  
  return c.json({ success: true, matched: statement_ids.length });
}