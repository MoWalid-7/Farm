<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\InventoryItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PhaseFiveApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_global_search_returns_matching_entities(): void
    {
        $api = $this->actingAs(User::factory()->create());
        $api->postJson('/api/v1/expenses', [
            'category' => 'Feed', 'amount' => 12, 'expense_date' => '2026-09-10',
        ])->assertCreated();

        $api->getJson('/api/v1/search?q=Feed')
            ->assertOk()->assertJsonPath('success', true)
            ->assertJsonFragment(['type' => 'expenses']);
    }

    public function test_resource_changes_are_audited(): void
    {
        $user = User::factory()->create();
        $api = $this->actingAs($user);
        $expense = Expense::create(['category' => 'Feed', 'amount' => 12, 'expense_date' => '2026-09-10']);
        $expense->update(['amount' => 15]);
        $expense->delete();

        $api->getJson('/api/v1/activity-logs')->assertOk()
            ->assertJsonCount(3, 'data.data');
    }

    public function test_notifications_include_low_stock_items(): void
    {
        $api = $this->actingAs(User::factory()->create());
        InventoryItem::create(['name' => 'Corn', 'unit' => 'kg', 'minimum_stock' => 5]);

        $api->getJson('/api/v1/notifications')->assertOk()
            ->assertJsonPath('unread_count', 1)
            ->assertJsonFragment(['type' => 'low_stock']);
    }
}
