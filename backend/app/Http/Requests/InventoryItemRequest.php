<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class InventoryItemRequest extends FormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { $item=$this->route('inventory_item'); $ignore=is_object($item)?$item->id:null; return ['supplier_id'=>['nullable','exists:suppliers,id'],'name'=>['required','string','max:255'],'sku'=>['nullable','string','max:100','unique:inventory_items,sku,'.$ignore],'unit'=>['required','string','max:50'],'minimum_stock'=>['nullable','numeric','min:0'],'description'=>['nullable','string']]; }
}
