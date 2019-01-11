// calc.cc
#include <napi.h>
//#include <node.h>

namespace calc {

Napi::Object getFileInfoForBlocks(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();

    Napi::Array blocks = info[0].As<Napi::Array>();
//    printf("blocks length = %d\n", blocks.Length());
    Napi::Object INPUT_BLOCKS = info[1].As<Napi::Object>().Get("BLOCKS").As<Napi::Object>();
    Napi::Object INPUT_FILES = info[1].As<Napi::Object>().Get("FILES").As<Napi::Object>();

    Napi::Object filesMap = Napi::Object::New(env);
    int weight = 0;

    for (int i = 0; i < (int)blocks.Length(); i++)
    {
        Napi::Number blockIndex = blocks.Get(i).As<Napi::Number>();
//        printf("blockIndex = %d\n", blockIndex.Int32Value());

         Napi::Object filesTemp = INPUT_BLOCKS.Get(blockIndex).As<Napi::Object>().Get("files").As<Napi::Object>();
         Napi::Array filesForBlock = filesTemp.GetPropertyNames();

        for (int j = 0; j < (int)filesForBlock.Length(); j++)
        {
            Napi::String fileIndex = filesForBlock.Get(j).As<Napi::String>();
            filesMap.Set(fileIndex, Napi::Boolean::New(env, true));
        }
    }

    Napi::Array files = filesMap.GetPropertyNames();
    Napi::Object blocksInFiles = Napi::Object::New(env);

    for (int i = 0; i < (int)files.Length(); i++)
    {
        Napi::String file = files.Get(i).As<Napi::String>();
        Napi::Array fileBlocks = INPUT_FILES.Get(file).As<Napi::Object>().Get("fileBlocks").As<Napi::Array>();

        for (int j = 0; j < (int)fileBlocks.Length(); j++)
        {
            Napi::Object block = fileBlocks.Get(j).As<Napi::Object>();

            Napi::String blockIndex = block.Get("blockIndex").As<Napi::String>();

            if (blocksInFiles.Has(blockIndex) == false)
            {
                Napi::Object blockObject = Napi::Object::New(env);
                blockObject.Set(blockIndex, blockIndex);
                blockObject[blockIndex] = blockIndex;
                blockObject["count"] = 1;
                blocksInFiles.Set(blockIndex, blockObject);
            }
            else
            {
                Napi::Object blockObject = blocksInFiles.Get(blockIndex).As<Napi::Object>();
                blockObject["count"] = blockObject.Get("count").As<Napi::Number>().Int32Value () + 1;
            }
        }
    }

    Napi::Array blocksInFilesKeys = blocksInFiles.GetPropertyNames();

    for (int i = 0; i < (int)blocksInFilesKeys.Length(); i++)
    {
        Napi::String blockIndex = blocksInFilesKeys.Get(i).As<Napi::String>();
        Napi::Object block = blocksInFiles.Get(blockIndex).As<Napi::Object>();
        int blockCount = block.Get("count").As<Napi::Number>().Int32Value();
        int filesBlockCount = INPUT_BLOCKS.Get(blockIndex).As<Napi::Object>().Get("files").As<Napi::Object>().GetPropertyNames().Length();

        if (blockCount == filesBlockCount)
        {
            weight = INPUT_BLOCKS.Get(blockIndex).As<Napi::Object>().Get("blockWeight").As<Napi::Number>().Int32Value() + weight;
        }
    }

    Napi::Object result = Napi::Object::New(env);
    result["files"] = files;
    result["blocks"] = blocksInFilesKeys;
    result["weight"] = weight;

    return result;
}


Napi::Object Init(Napi::Env env, Napi::Object exports)
{
    exports.Set(Napi::String::New(env, "getFileInfoForBlocks"),
              Napi::Function::New(env, getFileInfoForBlocks));
    return exports;
}

NODE_API_MODULE(calc, Init)

}  // namespace calc
