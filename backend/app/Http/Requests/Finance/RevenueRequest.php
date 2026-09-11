<?php

namespace App\Http\Requests\Finance;

class RevenueRequest extends MoneyRequest
{
    public function rules(): array
    {
        return array_merge(['source' => ['required', 'string', 'max:255'], 'description' => ['nullable', 'string']], $this->moneyRules('revenue_date'));
    }
}
