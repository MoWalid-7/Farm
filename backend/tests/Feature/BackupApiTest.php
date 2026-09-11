<?php

namespace Tests\Feature;

use App\Models\Backup;
use App\Models\Expense;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BackupApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_list_and_download_backup(): void
    {
        Storage::fake('local');
        $api = $this->actingAs(User::factory()->create());
        Expense::create(['category' => 'Feed', 'amount' => 12, 'expense_date' => '2026-09-10']);

        $response = $api->postJson('/api/v1/backups')->assertCreated();
        $backup = Backup::firstOrFail();
        Storage::disk('local')->assertExists('backups/'.$backup->filename);
        $api->getJson('/api/v1/backups')->assertOk()->assertJsonFragment(['filename' => $backup->filename]);
        $api->get('/api/v1/backups/'.$backup->id.'/download')->assertOk();
        $response->assertJsonPath('data.checksum', $backup->checksum);
    }

    public function test_backup_restore_replaces_business_data_and_is_audited(): void
    {
        Storage::fake('local');
        $api = $this->actingAs(User::factory()->create());
        Expense::create(['category' => 'Feed', 'amount' => 12, 'expense_date' => '2026-09-10']);
        $api->postJson('/api/v1/backups')->assertCreated();
        Expense::query()->delete();

        $api->postJson('/api/v1/backups/'.Backup::first()->id.'/restore')
            ->assertOk();
        $this->assertDatabaseHas('expenses', ['category' => 'Feed']);
        $this->assertDatabaseHas('activity_logs', ['event' => 'restored', 'subject_type' => Backup::class]);
    }
}
