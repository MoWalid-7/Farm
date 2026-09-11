<?php

namespace App\Http\Requests\Finance;

class WorkerPaymentRequest extends MoneyRequest
{
    public function rules(): array
    {
        return array_merge(['worker_id' => ['required', 'integer', 'exists:workers,id'], 'notes' => ['nullable', 'string']], $this->moneyRules('payment_date'));
    }
}
