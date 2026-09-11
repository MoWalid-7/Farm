<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Setting\UpdateSettingRequest;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        $setting = Setting::firstOrCreate([], Setting::defaults());

        return response()->json([
            'success' => true,
            'data' => $setting,
        ]);
    }

    public function update(UpdateSettingRequest $request)
    {
        $setting = Setting::firstOrCreate([], Setting::defaults());
        $setting->fill($request->validated());
        $setting->save();

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث الإعدادات بنجاح.',
            'data' => $setting->fresh(),
        ]);
    }
}
