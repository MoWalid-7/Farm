<?php

namespace App\Services;

use App\Models\Worker;
use Illuminate\Support\Facades\DB;

class WorkerService
{
    public function create(array $data): Worker
    {
        return DB::transaction(fn () => Worker::create($data));
    }

    public function update(Worker $worker, array $data): Worker
    {
        return DB::transaction(function () use ($worker, $data) {
            $worker->update($data);

            return $worker->fresh();
        });
    }

    public function delete(Worker $worker): void
    {
        DB::transaction(fn () => $worker->delete());
    }
}
