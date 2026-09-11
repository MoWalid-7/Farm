<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\ExpenseRequest;
use App\Models\Expense;
use App\Services\FinanceService;

class ExpenseController extends Controller
{
    public function index()
    {
        return response()->json(['success' => true, 'data' => Expense::latest('expense_date')->paginate(25)]);
    }

    public function store(ExpenseRequest $r, FinanceService $s)
    {
        return response()->json(['success' => true, 'data' => $s->createExpense($r->validated())], 201);
    }

    public function show(Expense $expense)
    {
        return response()->json(['success' => true, 'data' => $expense]);
    }

    public function update(ExpenseRequest $r, Expense $expense, FinanceService $s)
    {
        return response()->json(['success' => true, 'data' => $s->updateExpense($expense, $r->validated())]);
    }

    public function destroy(Expense $expense, FinanceService $s)
    {
        $s->deleteExpense($expense);

        return response()->json(['success' => true]);
    }
}
