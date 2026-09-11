<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PhaseFourInventoryApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_transactions_calculate_stock_and_low_stock_items(): void
    {
        $api = $this->actingAs(User::factory()->create());
        $supplier = $api->postJson('/api/v1/suppliers', ['name' => 'Feed Co.'])->assertCreated()->json('data');
        $item = $api->postJson('/api/v1/inventory-items', [
            'name' => 'Corn', 'supplier_id' => $supplier['id'], 'unit' => 'kg', 'minimum_stock' => 5,
        ])->assertCreated()->json('data');

        $api->postJson('/api/v1/inventory-transactions', [
            'inventory_item_id' => $item['id'], 'type' => 'purchase', 'quantity' => 10,
            'transaction_date' => '2026-09-10',
        ])->assertCreated();
        $api->postJson('/api/v1/inventory-transactions', [
            'inventory_item_id' => $item['id'], 'type' => 'usage', 'quantity' => 6,
            'transaction_date' => '2026-09-10',
        ])->assertCreated();

        $api->getJson('/api/v1/inventory-items/'.$item['id'])
            ->assertOk()->assertJsonPath('data.current_quantity', '4.000')
            ->assertJsonPath('data.is_low_stock', true);
    }

    public function test_stock_cannot_become_negative(): void
    {
        $api = $this->actingAs(User::factory()->create());
        $item = $api->postJson('/api/v1/inventory-items', [
            'name' => 'Medicine', 'unit' => 'bottle', 'minimum_stock' => 1,
        ])->assertCreated()->json('data');

        $api->postJson('/api/v1/inventory-transactions', [
            'inventory_item_id' => $item['id'], 'type' => 'usage', 'quantity' => 1,
            'transaction_date' => '2026-09-10',
        ])->assertStatus(422)->assertJsonValidationErrors('quantity');
    }
}
