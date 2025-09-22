// Test script for Twilio configuration
require('dotenv').config();
const twilio = require('twilio');

async function testTwilioConfig() {
    console.log('🧪 Testing Twilio Configuration...\n');

    // Check environment variables
    console.log('1️⃣ Checking Environment Variables:');
    console.log(`TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing'}`);
    console.log(`TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`TWILIO_PHONE_NUMBER: ${process.env.TWILIO_PHONE_NUMBER ? '✅ Set' : '❌ Missing'}\n`);

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        console.log('❌ Missing required environment variables. Please check your .env file.');
        return;
    }

    try {
        // Initialize Twilio client
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log('2️⃣ Testing Twilio Connection:');

        // Test account connection
        const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
        console.log(`✅ Twilio account status: ${account.status}`);
        console.log(`✅ Account friendly name: ${account.friendlyName}\n`);

        // Test phone number format
        console.log('3️⃣ Testing Phone Number Format:');
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;
        const toNumber = '+84329982474'; // Test number

        console.log(`From number: ${fromNumber}`);
        console.log(`To number: ${toNumber}`);

        // Validate phone number format
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(fromNumber)) {
            console.log('❌ From number format is invalid');
            return;
        }
        if (!phoneRegex.test(toNumber)) {
            console.log('❌ To number format is invalid');
            return;
        }
        console.log('✅ Phone number formats are valid\n');

        // Test sending SMS (commented out to avoid charges)
        console.log('4️⃣ SMS Test (Dry Run):');
        console.log('📱 Would send SMS:');
        console.log(`   From: ${fromNumber}`);
        console.log(`   To: ${toNumber}`);
        console.log(`   Body: [BILLIONS GYM] Test OTP: 123456`);
        console.log('⚠️  Uncomment the code below to actually send SMS (will incur charges)\n');

        // Uncomment to actually send SMS
        /*
        try {
            const message = await client.messages.create({
                body: '[BILLIONS GYM] Test OTP: 123456',
                from: fromNumber,
                to: toNumber
            });
            console.log(`✅ SMS sent successfully! Message SID: ${message.sid}`);
        } catch (smsError) {
            console.log(`❌ SMS failed: ${smsError.message}`);
            console.log(`❌ Error code: ${smsError.code}`);
        }
        */

        console.log('✅ Twilio configuration test completed successfully!');
        console.log('\n📋 Next Steps:');
        console.log('1. Make sure your Twilio account is verified');
        console.log('2. Purchase a phone number if you haven\'t already');
        console.log('3. Test the OTP functionality with a real phone number');

    } catch (error) {
        console.log(`❌ Twilio test failed: ${error.message}`);
        console.log(`❌ Error code: ${error.code || 'Unknown'}`);

        if (error.code === 20003) {
            console.log('💡 Solution: Check your Account SID and Auth Token');
        } else if (error.code === 21211) {
            console.log('💡 Solution: Check your phone number format');
        } else if (error.code === 21612) {
            console.log('💡 Solution: Check your From/To phone number combination');
        }
    }
}

// Run the test
testTwilioConfig().catch(console.error);


