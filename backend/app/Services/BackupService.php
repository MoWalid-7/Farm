<?php

namespace App\Services;

use App\Models\Backup;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;

class BackupService
{
    /** Tables containing application data, in foreign-key insertion order. */
    public const TABLES = [
        'settings', 'workers', 'expenses', 'revenues', 'worker_payments',
        'cycles', 'weights', 'customers', 'sales', 'suppliers',
        'inventory_items', 'inventory_transactions',
    ];

    public function create(?int $userId = null): Backup
    {
        $payload = [
            'version' => 1,
            'generated_at' => now()->toISOString(),
            'tables' => collect(self::TABLES)->mapWithKeys(
                fn (string $table) => [$table => DB::table($table)->get()->map(fn ($row) => (array) $row)->all()]
            )->all(),
        ];
        $contents = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        $filename = 'farm-backup-'.now()->format('Ymd-His').'-'.Str::lower(Str::random(8)).'.json';
        $path = 'backups/'.$filename;
        Storage::disk('local')->put($path, $contents);

        return Backup::create([
            'user_id' => $userId,
            'filename' => $filename,
            'disk' => 'local',
            'size' => strlen($contents),
            'checksum' => hash('sha256', $contents),
            'created_at' => now(),
        ]);
    }

    public function read(Backup $backup): array
    {
        $contents = Storage::disk($backup->disk)->get('backups/'.$backup->filename);
        if (! hash_equals($backup->checksum, hash('sha256', $contents))) {
            throw new InvalidArgumentException('Backup checksum does not match.');
        }

        return $this->validate(json_decode($contents, true, 512, JSON_THROW_ON_ERROR));
    }

    public function readUpload(UploadedFile $file): array
    {
        return $this->validate(json_decode($file->get(), true, 512, JSON_THROW_ON_ERROR));
    }

    public function validate(mixed $payload): array
    {
        if (! is_array($payload) || ($payload['version'] ?? null) !== 1 || ! isset($payload['tables']) || ! is_array($payload['tables'])) {
            throw new InvalidArgumentException('Invalid backup payload.');
        }
        foreach (self::TABLES as $table) {
            if (! isset($payload['tables'][$table]) || ! is_array($payload['tables'][$table])) {
                throw new InvalidArgumentException('Invalid backup payload tables.');
            }
            foreach ($payload['tables'][$table] as $row) {
                if (! is_array($row)) {
                    throw new InvalidArgumentException('Invalid backup row.');
                }
            }
        }

        return $payload;
    }

    public function restore(array $payload): void
    {
        $this->validate($payload);
        DB::transaction(function () use ($payload): void {
            foreach (array_reverse(self::TABLES) as $table) {
                DB::table($table)->delete();
            }
            foreach (self::TABLES as $table) {
                $rows = $payload['tables'][$table];
                foreach (array_chunk($rows, 500) as $chunk) {
                    if ($chunk) {
                        DB::table($table)->insert($chunk);
                    }
                }
            }
        });
    }
}
