<?php

namespace App\Http\Requests\Setting;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'farm_name' => ['sometimes', 'string', 'max:255'],
            'farm_information' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'backup_enabled' => ['sometimes', 'boolean'],
            'backup_frequency' => ['sometimes', 'in:daily,weekly,monthly'],
            'app_name' => ['sometimes', 'string', 'max:255'],
            'app_version' => ['sometimes', 'string', 'max:50'],
            'welcome_screen_completed' => ['sometimes', 'boolean'],
            'welcome_screen_status' => ['sometimes', 'in:active,disabled'],
        ];
    }
}
