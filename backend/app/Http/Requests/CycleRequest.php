<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class CycleRequest extends FormRequest {
    public function authorize(): bool{return true;}
    protected function prepareForValidation(): void { $this->merge(array_filter(['bird_count'=>$this->bird_count??$this->initial_birds??$this->birds_count],fn($v)=>$v!==null)); }
    public function rules(): array{return ['name'=>['required','string','max:255'],'start_date'=>['required','date'],'end_date'=>['nullable','date','after_or_equal:start_date'],'bird_count'=>['required','integer','min:1'],'status'=>['sometimes','in:active,completed,cancelled']];}
}
