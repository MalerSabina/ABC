// calc.cc
#include <napi.h>
//#include <node.h>
#include <exception>

#if defined _WIN32
#include <windows.h>
#else
#include <unistd.h>
#endif

#include "sparsepp/spp.h"
using spp::sparse_hash_map;

namespace calc {

Napi::Value EmptyCallback(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    return env.Undefined();
}

void copyNapiArrayToVector(std::vector<std::string>& dest, const Napi::Array& arr)
{
    int length = arr.Length();

    for (int i = 0; i < length; i++)
    {
        const auto& arrValue = arr[i];
        std::string value = arrValue.ToString();
        dest.push_back(value);
    }
}

void copyVectorToNapiArray(Napi::Env env, Napi::Array& arr, std::vector<std::string>& src)
{
    int length = src.size();

    for (int i = 0; i < length; i++)
    {
        const auto& value = src[i];
        arr[i] = value.c_str();
    }
}

static sparse_hash_map<std::string, std::vector<std::string> > FILES;
static sparse_hash_map<std::string, sparse_hash_map<std::string, int> > BLOCKS;
static sparse_hash_map<std::string, int> BLOCK_WEIGHTS;
static std::vector<std::string> BLOCK_KEYS = {};

Napi::Value setInput(const Napi::CallbackInfo& info)
{
    const auto& INPUT = info[0].As<Napi::Object>();
    Napi::Object files = INPUT["FILES"].ToObject();
    Napi::Object blocks = INPUT["BLOCKS"].As<Napi::Object>();
    const Napi::Array blockKeys = INPUT["BLOCK_KEYS"].As<Napi::Array>();

    BLOCK_WEIGHTS = {};

    // FILES processing
    FILES = {};
    const Napi::Array fileIds = files.GetPropertyNames();

    for (int i = 0; i < (int)fileIds.Length(); i++)
    {
        const std::string fileId = fileIds[i].ToString();
        std::vector<std::string> fileBlocks = {};

        const Napi::Object fileItem = files.Get(fileId).As<Napi::Object>();
        const Napi::Array fileBlocksArray = fileItem["fileBlocks"].As<Napi::Array>();

        copyNapiArrayToVector(fileBlocks, fileBlocksArray);
        FILES[fileId] = fileBlocks;
    }

    // BLOCKS processing
    BLOCKS = {};

    const Napi::Array blockIds = blocks.GetPropertyNames();
    int blockIdsLength = (int)blockIds.Length();

    for (int i = 0; i < blockIdsLength; i++)
    {
        const std::string blockId = blockIds[i].ToString();
        const Napi::Object blockItem = blocks.Get(blockId).As<Napi::Object>();

        int blockWeight = blockItem["blockWeight"].ToNumber().Int32Value();
        BLOCK_WEIGHTS[blockId] = blockWeight;

        Napi::Object filesInBlockObject = blockItem["files"].As<Napi::Object>();
        sparse_hash_map<std::string, int> filesInBlock;

        const Napi::Array fileIdsInBlock = filesInBlockObject.GetPropertyNames();

        for (int j = 0; j < (int) fileIdsInBlock.Length(); j++)
        {
            const std::string fileId = fileIdsInBlock[j].ToString();
            filesInBlock[fileId] = 1;
        }

        BLOCKS[blockId] = filesInBlock;
    }

    BLOCK_KEYS = {};
    copyNapiArrayToVector(BLOCK_KEYS, blockKeys);

    return info.Env().Undefined();
}

class CalcWorker : public Napi::AsyncWorker {

private:
    Napi::Promise::Deferred deferred;
    const Napi::CallbackInfo& info;

    std::vector<std::string> blocks = {};
    int delay = 0;

    // Result variables
    int weight = 0;
    std::vector<std::string> files = {};
    std::vector<std::string> blocksToRemove = {};

public:
    CalcWorker(Napi::Function& callback, Napi::Promise::Deferred deferred, const Napi::CallbackInfo& cInfo)
    : Napi::AsyncWorker(callback), deferred(deferred), info(cInfo) {

        const auto& blocksParam = info[0].As<Napi::Array>();
        copyNapiArrayToVector(blocks, blocksParam);
    }

    ~CalcWorker() {}

    void Execute () {

//        Sleep(delay);

        sparse_hash_map<std::string, int> filesMap;

        for (int i = 0; i < blocks.size(); i++)
        {
            const auto& blockIndex = blocks[i];
            const auto& filesForBlock = BLOCKS[blockIndex];
//            printf("blockIndex = %s\n", blockIndex.c_str());

            for (const auto& it : filesForBlock)
            {
                filesMap[it.first] = 1;
            }
        }

        sparse_hash_map<std::string, int> blocksInFiles;

        for (const auto& it : filesMap)
        {
            files.push_back(it.first);
        }

//    printf("filesLength = %d\n", files.size());

        for (int i = 0; i < files.size(); i++)
        {
            const auto& fileBlocks = FILES[files[i]];
            int fileBlocksSize = fileBlocks.size();
//        printf("fileBlocksLength = %d\n", fileBlocks.size());

            for (int j = 0; j < fileBlocksSize; j++)
            {
                blocksInFiles[fileBlocks[j]]++;
            }
        }

        sparse_hash_map<std::string, int> blocksToRemoveMap;

//        printf("blocksInFiles length = %d\n", blocksInFiles.size());

        for (const auto& it : blocksInFiles)
        {
            const auto& blockIndex = it.first;
            int blockCount = it.second;

            const auto & inputBlocksAtIndex = BLOCKS[blockIndex];

            int filesBlockCount = inputBlocksAtIndex.size();

            if (blockCount == filesBlockCount)
            {
                int blockWeight = BLOCK_WEIGHTS[blockIndex];
                weight += blockWeight;
                blocksToRemoveMap[blockIndex] = 1;
            }
        }

        for (const auto& it : blocksToRemoveMap)
        {
            blocksToRemove.push_back(it.first);
        }

//        printf("Inside CalcWorker Execute with Result\n");
    }

    void OnError() {

        Napi::HandleScope scope(Env());
        deferred.Reject(Napi::Error::New(Env(), "Something wrong").Value());

        // Call empty function
        Callback().Call({});
    }


    void OnOK()
    {
        Napi::Env env = Env();

        Napi::Object Result = Napi::Object::New(env);

        Napi::Array filesForResult = Napi::Array::New(env, files.size());
        copyVectorToNapiArray(env, filesForResult, files);
        Result["files"] = filesForResult;

        Napi::Array blocksForResult = Napi::Array::New(env, blocksToRemove.size());
        copyVectorToNapiArray(env, blocksForResult, blocksToRemove);
        Result["blocks"] = blocksForResult;

        Result["weight"] = Napi::Number::New(env, weight);

        deferred.Resolve(Result);

        // Call empty function
        Callback().Call({});
    }
};

Napi::Object getFileInfoForBlocks(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(info.Env());
    Napi::Function callback = Napi::Function::New(env, EmptyCallback);

    CalcWorker* worker = new CalcWorker(callback, deferred, info);
    worker->Queue();

    return deferred.Promise();
}


Napi::Object Init(Napi::Env env, Napi::Object exports)
{
    Napi::HandleScope scope(env);

    exports.Set("getFileInfoForBlocks", Napi::Function::New(env, getFileInfoForBlocks));
    exports.Set("setInput", Napi::Function::New(env, setInput));

    return exports;
}

NODE_API_MODULE(calc, Init)

}  // namespace calc
