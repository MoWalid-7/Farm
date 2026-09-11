<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'period' => ['nullable', 'in:daily,weekly,monthly,custom'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'date' => ['nullable', 'date'],
            'cycle_id' => ['nullable', 'integer', 'exists:cycles,id'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->route('period')) {
            $this->merge(['period' => $this->route('period')]);
        }
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($this->input('period') === 'custom' &&
                (! $this->filled('from') || ! $this->filled('to'))) {
                $validator->errors()->add('from', 'From and to are required for a custom report.');
            }
        });
    }
}
