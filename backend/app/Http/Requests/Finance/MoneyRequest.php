<?php

namespace App\Http\Requests\Finance;

use Illuminate\Foundation\Http\FormRequest;

abstract class MoneyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function moneyRules(string $date): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0'],
            $date => ['required', 'date'],
        ];
    }
}
