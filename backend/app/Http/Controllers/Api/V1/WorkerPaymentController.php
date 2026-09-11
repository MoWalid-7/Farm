<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\WorkerPaymentRequest;
use App\Models\WorkerPayment;
use App\Services\FinanceService;
use Illuminate\Http\Request;

class WorkerPaymentController extends Controller
{
    public function index(Request $r)
    {
        $q = WorkerPayment::with('worker')->latest('payment_date');
        if ($search = $r->query('search')) {
            $q->whereHas('worker', fn($w) => $w->where('name', 'like', "%{$search}%"));
        }
        if ($workerId = $r->query('worker_id')) {
            $q->where('worker_id', $workerId);
        }
        if ($from = $r->query('date_from')) {
            $q->whereDate('payment_date', '>=', $from);
        }
        if ($to = $r->query('date_to')) {
            $q->whereDate('payment_date', '<=', $to);
        }
        $data = $q->paginate((int) ($r->query('per_page', 25)));
        // Append total sum for the current filtered result
        $total = WorkerPayment::query()
            ->when($r->query('worker_id'), fn($q2, $wid) => $q2->where('worker_id', $wid))
            ->when($r->query('date_from'), fn($q2, $from) => $q2->whereDate('payment_date', '>=', $from))
            ->when($r->query('date_to'), fn($q2, $to) => $q2->whereDate('payment_date', '<=', $to))
            ->sum('amount');
        return response()->json(['success' => true, 'data' => $data, 'meta' => ['total_amount' => $total]]);
    }

    public function store(WorkerPaymentRequest $r, FinanceService $s)
    {
        return response()->json(['success' => true, 'data' => $s->createPayment($r->validated())->load('worker')], 201);
    }

    public function show(WorkerPayment $workerPayment)
    {
        return response()->json(['success' => true, 'data' => $workerPayment->load('worker')]);
    }

    public function update(WorkerPaymentRequest $r, WorkerPayment $workerPayment, FinanceService $s)
    {
        return response()->json(['success' => true, 'data' => $s->updatePayment($workerPayment, $r->validated())]);
    }

    public function destroy(WorkerPayment $workerPayment, FinanceService $s)
    {
        $s->deletePayment($workerPayment);
        return response()->json(['success' => true]);
    }
}

