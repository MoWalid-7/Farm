<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\WorkerPaymentRequest;
use App\Models\WorkerPayment;
use App\Services\FinanceService;

class WorkerPaymentController extends Controller
{
    public function index()
    {
        return response()->json(['success' => true, 'data' => WorkerPayment::with('worker')->latest('payment_date')->paginate(25)]);
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
