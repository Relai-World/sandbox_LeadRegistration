require('dotenv').config();
const supabase = require('./supabase');

async function debugSupabase() {
    console.log('--- Starting Supabase Debug ---');

    if (!supabase.isConfigured) {
        console.error('Supabase is not configured correctly.');
        return;
    }

    try {
        // 2. Attempting to insert a test row
        console.log('\n2. Attempting to insert a test row...');

        const testRow = {
            rera_number: 'DEBUG-RERA-' + Date.now(),
            projectname: 'Debug Test Project',
            buildername: 'Debug Builder',
            baseprojectprice: 5000000,
            projectbrochure: null,
            contact: 1234567890,
            projectlocation: 'Debug Location',
            project_type: 'Apartment',
            buildingname: 'Debug Building',
            communitytype: 'Gated Community',
            total_land_area: '10 Acres',
            number_of_towers: 1,
            number_of_floors: 10,
            number_of_flats_per_floor: 4,
            total_number_of_units: 40,
            project_launch_date: new Date().toISOString(),
            possession_date: new Date().toISOString(),
            construction_status: 'Ongoing',
            open_space: 50,
            areaname: 'Debug Area',
            pricesheet_link_1: null,
            total_buildup_area: '10000 sqft',
            uds: '500 sqft',
            fsi: 2.5,
            carpet_area_percentage: 70,
            floor_to_ceiling_height: 10,
            main_door_height: 8,
            price_per_sft: 5000,
            external_amenities: 'Gym, Pool',
            specification: 'Standard',
            powerbackup: 'Full',
            no_of_passenger_lift: 2,
            no_of_service_lift: 1,
            visitor_parking: 'yes',
            ground_vehicle_movement: 'no',
            configurations: [],
            amount_for_extra_car_parking: 500000,
            home_loan: null, // Set to null to avoid enum error
            available_banks_for_loan: [],
            previous_complaints_on_builder: null,
            complaint_details: null,
            construction_material: 'Concrete',
            commission_percentage: 2,
            what_is_there_price: 5500000,
            what_is_relai_price: 5000000,
            after_agreement_of_sale_what_is_payout_time_period: 30,
            is_lead_registration_required_before_site_visit: 'no',
            turnaround_time_for_lead_acknowledgement: 24,
            is_there_validity_period_for_registered_lead: 'no',
            validity_period_value: null,
            person_to_confirm_registration: [],
            notes_comments_on_lead_registration_workflow: null,
            accepted_modes_of_lead_registration: [],
            builder_age: 10,
            builder_total_properties: 5,
            builder_upcoming_properties: 2,
            builder_completed_properties: 3,
            builder_ongoing_projects: 2,
            builder_origin_city: 'Debug City',
            builder_operating_locations: [],
            floor_rise_charges: 'no',
            floor_rise_amount_per_floor: 0,
            floor_rise_applicable_above_floor_no: 0,
            facing_charges: 'no',
            preferential_location_charges: 'no',
            preferential_location_charges_conditions: null,
            status: 'Unverified',
            useremail: 'debug@test.com',
            poc_name: 'Debug POC',
            poc_contact: 9876543210,
            poc_role: 'Manager',
            cp: false,
            city: 'Debug City',
            state: 'Debug State',
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString()
        };

        const { data: inserted, error: insertError } = await supabase
            .from('Unverified_Properties')
            .insert([testRow])
            .select();

        if (insertError) {
            console.error('❌ Insert failed:', JSON.stringify(insertError, null, 2));
        } else {
            console.log('✅ Insert successful:', inserted);

            // 3. Read it back
            console.log('\n3. Reading back the test row...');
            const { data: readBack, error: readError } = await supabase
                .from('Unverified_Properties')
                .select('*')
                .eq('rera_number', testRow.rera_number);

            if (readError) {
                console.error('❌ Read back failed:', readError);
            } else {
                console.log('✅ Read back successful. Rows found:', readBack.length);
                console.log('Row data:', readBack[0]);
            }

            // 4. Clean up
            console.log('\n4. Cleaning up test row...');
            const { error: deleteError } = await supabase
                .from('Unverified_Properties')
                .delete()
                .eq('rera_number', testRow.rera_number);

            if (deleteError) {
                console.error('❌ Delete failed:', deleteError);
            } else {
                console.log('✅ Cleanup successful.');
            }
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

debugSupabase();
