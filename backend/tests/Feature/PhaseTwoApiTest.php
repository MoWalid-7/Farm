<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Worker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PhaseTwoApiTest extends TestCase
{
    use RefreshDatabase;

    private function user(): User
    {
        return User::factory()->create();
    }

    public function test_worker_and_payment_require_active_worker_and_non_negative_money(): void
    {
        $user = $this->user();
        $worker = Worker::create(['name' => 'Inactive', 'status' => 'inactive', 'daily_wage' => 10]);

        $this->actingAs($user)->postJson('/api/v1/worker-payments', [
            'worker_id' => $worker->id, 'amount' => 25, 'payment_date' => '2026-09-10',
        ])->assertStatus(422)->assertJsonValidationErrors('worker_id');

        $this->actingAs($user)->postJson('/api/v1/expenses', [
            'category' => 'Feed', 'amount' => -1, 'expense_date' => '2026-09-10',
        ])->assertStatus(422)->assertJsonValidationErrors('amount');
    }

    public function test_dashboard_summary_calculates_revenues_and_costs(): void
    {
        $user = $this->user();
        $worker = Worker::create(['name' => 'Active', 'status' => 'active']);
        $this->actingAs($user)->postJson('/api/v1/revenues', ['source' => 'Sale', 'amount' => 100, 'revenue_date' => '2026-09-10'])->assertCreated();
        $this->actingAs($user)->postJson('/api/v1/expenses', ['category' => 'Feed', 'amount' => 20, 'expense_date' => '2026-09-10'])->assertCreated();
        $this->actingAs($user)->postJson('/api/v1/worker-payments', ['worker_id' => $worker->id, 'amount' => 30, 'payment_date' => '2026-09-10'])->assertCreated();

        $this->actingAs($user)->getJson('/api/v1/dashboard/summary?from=2026-09-01&to=2026-09-30')
            ->assertOk()->assertJsonPath('data.total_revenues', 100)
            ->assertJsonPath('data.total_costs', 50)->assertJsonPath('data.net_profit', 50)
            ->assertJsonPath('data.active_workers', 1);
    }
}
