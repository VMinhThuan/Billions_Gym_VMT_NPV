import { apiService } from '../src/api/apiService';

// Test function to check login with existing accounts
async function testLogin() {
    console.log('🔍 Testing API connection and login...');
    
    // Test accounts from database
    const testAccounts = [
        { sdt: '0900003004', password: 'admin', role: 'Admin' },
        { sdt: '0900004001', password: '123456', role: 'HoiVien' },
        { sdt: '0900004002', password: '123456', role: 'PT' }
    ];

    for (const account of testAccounts) {
        try {
            console.log(`\n🔐 Testing login for ${account.role}: ${account.sdt}`);
            
            const result = await apiService.login(account.sdt, account.password);
            console.log(`✅ Login successful for ${account.role}:`, {
                hasToken: !!result.token,
                userRole: result.nguoiDung?.vaiTro,
                userName: result.nguoiDung?.hoTen
            });
            
            // Test token decode
            if (result.token) {
                const payload = JSON.parse(atob(result.token.split('.')[1]));
                console.log(`🔑 Token payload:`, {
                    id: payload.id,
                    vaiTro: payload.vaiTro,
                    sdt: payload.sdt
                });
            }
            
        } catch (error) {
            console.error(`❌ Login failed for ${account.role}:`, error.message);
        }
    }
}

// Run test
testLogin();