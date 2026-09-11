<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('cycles', function (Blueprint $table) {
            $table->id(); $table->string('name'); $table->date('start_date');
            $table->date('end_date')->nullable(); $table->unsignedInteger('bird_count');
            $table->string('status')->default('active'); $table->timestamps();
            $table->index(['status','start_date']);
        });
    }
    public function down(): void { Schema::dropIfExists('cycles'); }
};
