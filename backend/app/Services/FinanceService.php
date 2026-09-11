<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\Revenue;
use App\Models\Worker;
use App\Models\WorkerPayment;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FinanceService
{
    public function createExpense(array $data): Expense
    {
        return DB::transaction(fn () => Expense::create($data));
    }

    public function updateExpense(Expense $model, array $data): Expense
    {
        return DB::transaction(function () use ($model, $data) {
            $model->update($data);

            return $model->fresh();
        });
    }

    public function deleteExpense(Expense $model): void
    {
        DB::transaction(fn () => $model->delete());
    }

    public function createRevenue(array $data): Revenue
    {
        return DB::transaction(fn () => Revenue::create($data));
    }

    public function updateRevenue(Revenue $model, array $data): Revenue
    {
        return DB::transaction(function () use ($model, $data) {
            $model->update($data);

            return $model->fresh();
        });
    }

    public function deleteRevenue(Revenue $model): void
    {
        DB::transaction(fn () => $model->delete());
    }

    public function createPayment(array $data): WorkerPayment
    {
        return DB::transaction(function () use ($data) {
            $worker = Worker::lockForUpdate()->findOrFail($data['worker_id']);
            if ($worker->status !== 'active') {
                throw ValidationException::withMessages(['worker_id' => ['Worker must be active.']]);
            }

            return WorkerPayment::create($data);
        });
    }

    public function updatePayment(WorkerPayment $payment, array $data): WorkerPayment
    {
        return DB::transaction(function () use ($payment, $data) {
            $worker = Worker::lockForUpdate()->findOrFail($data['worker_id']);
            if ($worker->status !== 'active') {
                throw ValidationException::withMessages(['worker_id' => ['Worker must be active.']]);
            }
            $payment->update($data);

            return $payment->fresh('worker');
        });
    }

    public function deletePayment(WorkerPayment $payment): void
    {
        DB::transaction(fn () => $payment->delete());
    }
}
