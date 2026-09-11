<?php

namespace Tests\Feature;

use App\Models\Cycle;
use App\Models\Expense;
use App\Models\Revenue;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_custom_financial_report_uses_dashboard_totals(): void
    {
        $api = $this->actingAs(User::factory()->create());
        Revenue::create(['source' => 'Eggs', 'amount' => 125, 'revenue_date' => '2026-09-10']);
        Expense::create(['category' => 'Feed', 'amount' => 25, 'expense_date' => '2026-09-10']);

        $api->getJson('/api/v1/reports/financial?period=custom&from=2026-09-10&to=2026-09-10')
            ->assertOk()
            ->assertJsonPath('data.summary.total_revenues', 125)
            ->assertJsonPath('data.summary.total_expenses', 25)
            ->assertJsonPath('data.summary.net_profit', 100);
    }

    public function test_custom_report_requires_a_complete_date_range(): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson('/api/v1/reports/custom?from=2026-09-10')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['from']);
    }

    public function test_cycle_report_returns_cycle_sales_and_weights(): void
    {
        $api = $this->actingAs(User::factory()->create());
        $cycle = Cycle::create([
            'name' => 'September batch', 'start_date' => '2026-09-01',
            'bird_count' => 100, 'status' => 'active',
        ]);
        $cycle->weights()->create([
            'bird_count' => 10, 'total_weight' => 25,
            'average_weight' => 2.5, 'recorded_date' => '2026-09-10',
        ]);

        $api->getJson('/api/v1/reports/cycles')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'September batch')
            ->assertJsonPath('data.0.total_weight', 25);
    }

    public function test_financial_export_is_authenticated_utf8_csv_with_bom_and_attachment(): void
    {
        Revenue::create(['source' => 'بيض', 'amount' => 125, 'revenue_date' => '2026-09-10']);

        $this->withHeader('Accept', 'application/json')
            ->get('/api/v1/reports/financial/export?period=custom&from=2026-09-10&to=2026-09-10')
            ->assertUnauthorized();

        $response = $this->actingAs(User::factory()->create())
            ->get('/api/v1/reports/financial/export?period=custom&from=2026-09-10&to=2026-09-10')
            ->assertOk();

        $this->assertStringStartsWith("\xEF\xBB\xBF", $response->streamedContent());
        $this->assertStringContainsString('الفترة', $response->streamedContent());
        $this->assertStringContainsString('financial-report.csv', (string) $response->headers->get('content-disposition'));
        $this->assertSame('text/csv; charset=UTF-8', $response->headers->get('content-type'));
    }

    public function test_cycle_export_contains_arabic_headers_and_cycle_data(): void
    {
        $cycle = Cycle::create([
            'name' => 'دورة سبتمبر', 'start_date' => '2026-09-01',
            'bird_count' => 20, 'status' => 'active',
        ]);

        $response = $this->actingAs(User::factory()->create())
            ->get('/api/v1/reports/cycles/export')
            ->assertOk();

        $csv = $response->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $csv);
        $this->assertStringContainsString('اسم الدورة', $csv);
        $this->assertStringContainsString('دورة سبتمبر', $csv);
        $this->assertStringContainsString('cycles-report.csv', (string) $response->headers->get('content-disposition'));
    }

    public function test_print_report_is_html_and_rtl(): void
    {
        $response = $this->actingAs(User::factory()->create())
            ->get('/api/v1/reports/cycles/print')
            ->assertOk();

        $this->assertStringContainsString('text/html; charset=UTF-8', (string) $response->headers->get('content-type'));
        $this->assertStringContainsString('<html lang="ar" dir="rtl">', $response->getContent());
    }
}
