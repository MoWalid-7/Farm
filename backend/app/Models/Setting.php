<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'farm_name',
        'farm_information',
        'currency',
        'backup_enabled',
        'backup_frequency',
        'app_name',
        'app_version',
        'welcome_screen_completed',
        'welcome_screen_status',
    ];

    protected $casts = [
        'backup_enabled' => 'boolean',
        'welcome_screen_completed' => 'boolean',
    ];

    public static function defaults(): array
    {
        return [
            'farm_name' => 'نظام إدارة المزرعة',
            'farm_information' => 'إدارة دورة المزرعة، العمال، المصروفات، الإيرادات، المبيعات والاحتياطيات.',
            'currency' => 'SAR',
            'backup_enabled' => true,
            'backup_frequency' => 'weekly',
            'app_name' => 'Farm Management System',
            'app_version' => '1.0.0',
            'welcome_screen_completed' => false,
            'welcome_screen_status' => 'active',
        ];
    }
}
