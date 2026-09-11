<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\RevenueRequest;
use App\Models\Revenue;
use App\Services\FinanceService;

class RevenueController extends Controller
{
    public function index()
    {
        return response()->json(['success' => true, 'data' => Revenue::latest('revenue_date')->paginate(25)]);
    }

    public function store(RevenueRequest $r, FinanceService $s)
    {
        return response()->json(['success' => true, 'data' => $s->createRevenue($r->validated())], 201);
    }

    public function show(Revenue $revenue)
    {
        return response()->json(['success' => true, 'data' => $revenue]);
    }

    public function update(RevenueRequest $r, Revenue $revenue, FinanceService $s)
    {
        return response()->json(['success' => true, 'data' => $s->updateRevenue($revenue, $r->validated())]);
    }

    public function destroy(Revenue $revenue, FinanceService $s)
    {
        $s->deleteRevenue($revenue);

        return response()->json(['success' => true]);
    }
}
