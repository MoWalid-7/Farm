<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_read_and_update_settings(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web')
            ->getJson('/api/v1/settings')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.farm_name', 'نظام إدارة المزرعة');

        $this->actingAs($user, 'web')
            ->putJson('/api/v1/settings', [
                'farm_name' => 'مزرعة النخيل',
                'currency' => 'SAR',
                'welcome_screen_completed' => true,
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.farm_name', 'مزرعة النخيل')
            ->assertJsonPath('data.currency', 'SAR');
    }
}
