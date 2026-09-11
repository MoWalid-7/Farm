<?php

namespace App\Http\Requests\Finance;

class ExpenseRequest extends MoneyRequest
{
    public function rules(): array
    {
        return array_merge(['category' => ['required', 'string', 'max:255'], 'description' => ['nullable', 'string']], $this->moneyRules('expense_date'));
    }
}
